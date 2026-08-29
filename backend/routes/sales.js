import express from 'express';
const router = express.Router();
import Sale from '../models/Sale.js';
import Item from '../models/Item.js';
import CashSession from '../models/CashSession.js';
import { generateInvoice } from '../utils/generateInvoice.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Settings from '../models/Settings.js';
import { authenticate, requireShopAdmin, preventSuperAdmin } from '../middleware/auth.js';
import { resolveShopId } from '../utils/shopResolver.js';

// Helper to verify Owner Password (Anti-Theft)
// We now use `authenticate` and `requireShopAdmin` standard RBAC for powerful actions
// If you want to keep the literal pin-based password logic, you can combine them, but for Multi-Tenant RBAC
// checking user roles (requireShopAdmin) is standard. We'll leave the password check wrapped over the new system to preserve feature parity.
const verifyOwnerPassword = async (req, res, next) => {
  try {
    const password = req.headers['x-owner-password'];
    
    // Bypass if user is super admin or shop admin from token
    if (req.user && ['super_admin', 'shop_admin'].includes(req.user.role)) return next();

    let settings = await Settings.findOne({ shopId: req.user.shopId });
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    const correctPassword = settings.ownerPassword;
    
    if (password !== correctPassword) {
      return res.status(403).json({ message: "Owner authorization required for this action." });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Auth check failed" });
  }
};

// ── Super Admin: Get ALL sales across all shops ──────────────────────
router.get('/all', authenticate, async (req, res) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super Admin only.' });
  }
  try {
    const sales = await Sale.find({}).sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

import mongoose from 'mongoose';

// Get all sales (shop admin - their shop only)
router.get('/', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const rawShopId = req.query.shopId || (req.user && req.user.shopId);
    let filter = {};
    if (rawShopId) {
      const targetShopId = await resolveShopId(rawShopId);
      if (targetShopId && mongoose.Types.ObjectId.isValid(targetShopId)) {
        filter = { shopId: targetShopId };
      }
    }
    const sales = await Sale.find(filter).sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new sale
router.post('/', authenticate, requireShopAdmin, async (req, res) => {
  const { items, totalAmount, totalProfit, cashierName, customerName, shopId } = req.body;
  const rawShopId = req.user.shopId || shopId;
  const targetShopId = await resolveShopId(rawShopId);
  
  try {
    if (!targetShopId) {
      return res.status(400).json({ message: 'Shop ID is required for sale creation' });
    }

    // 1. Fetch current settings for the invoice
    let settings = await Settings.findOne({ shopId: targetShopId });
    if (!settings) {
      settings = new Settings({ shopId: targetShopId });
      await settings.save();
    }

    // 2. Create the sale record
    const method = req.body.paymentMethod || 'CASH';
    const isBank = method === 'BANK_TRANSFER' || method === 'EASYPAISA' || method === 'ONLINE';

    // Generate unique serial number (starting from 1)
    const existingCount = await Sale.countDocuments({ shopId: targetShopId });
    const serialNumber = 1 + existingCount;
    const invoiceNumber = `INV-${String(serialNumber).padStart(5, '0')}`;

    const sale = new Sale({
      shopId: targetShopId,
      items,
      totalAmount,
      totalProfit,
      serialNumber,
      invoiceNumber,
      cashierName: cashierName || req.user.fullName || "Shop Admin",
      customerName: customerName || "Walk-in Customer",
      customerPhone: req.body.customerPhone || "",
      paymentMethod: method,
      paymentProof: req.body.paymentProof || "",
      transactionId: req.body.transactionId || "",
      approvalStatus: req.body.approvalStatus || (isBank ? 'PENDING_APPROVAL' : 'APPROVED')
    });
    
    // 3. Update stock for each item
    for (const item of items) {
      const product = await Item.findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.name} not found`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
      product.stock -= item.quantity;
      product.lastUpdated = new Date().toISOString().split('T')[0];
      await product.save();
    }
    
    const newSale = await sale.save();

    // 4. Update active CashSession (Anti-Theft / Reporting)
    const activeSession = await CashSession.findOne({ status: 'open' });
    if (activeSession) {
      activeSession.totalSales += totalAmount;
      activeSession.expectedCash += totalAmount;
      await activeSession.save();
    }

    // 5. Generate PDF Invoice
    const fileName = `invoice-${newSale._id}.pdf`;
    const invoicesDir = path.join(__dirname, '..', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const filePath = path.join(invoicesDir, fileName);
    
    try {
      await generateInvoice(newSale, filePath, settings);
      // Attach invoice URL to response
      const responseData = newSale.toObject();
      responseData.invoiceUrl = `/invoices/${fileName}`;
      res.status(201).json(responseData);
    } catch (pdfErr) {
      console.error("PDF Generation failed:", pdfErr);
      res.status(211).json({ ...newSale.toObject(), message: "Sale created but PDF failed" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Return a sale (and reverse stock) - REQUIRE OWNER PASSWORD
router.put('/:id/return', authenticate, preventSuperAdmin, verifyOwnerPassword, async (req, res) => {
  const { reason } = req.body;
  
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale || sale.status === 'returned') {
      return res.status(404).json({ message: 'Sale not found or already returned' });
    }

    // 1. Reverse stock for each item
    for (const item of sale.items) {
      await Item.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }

    // 2. Update sale record
    sale.status = 'returned';
    sale.returnReason = reason || "Customer Return";
    sale.returnDate = new Date();
    const updatedSale = await sale.save();

    // 3. Update active CashSession
    const activeSession = await CashSession.findOne({ status: 'open' });
    if (activeSession) {
      activeSession.totalReturns += sale.totalAmount;
      activeSession.expectedCash -= sale.totalAmount;
      await activeSession.save();
    }

    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Edit a sale (and adjust stock) - REQUIRE OWNER PASSWORD
router.put('/:id', authenticate, preventSuperAdmin, verifyOwnerPassword, async (req, res) => {
  const { items, totalAmount, totalProfit } = req.body;
  
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const oldAmount = sale.totalAmount;

    // Adjust stock based on differences
    for (const newItem of items) {
      const oldItem = sale.items.find(i => i.productId.toString() === newItem.productId.toString());
      if (oldItem) {
        const qtyDifference = newItem.quantity - oldItem.quantity;
        if (qtyDifference !== 0) {
          const product = await Item.findById(newItem.productId);
          if (product) {
            if (qtyDifference > 0 && product.stock < qtyDifference) {
              throw new Error(`Insufficient stock for ${newItem.name}`);
            }
            product.stock -= qtyDifference;
            product.lastUpdated = new Date().toISOString().split('T')[0];
            await product.save();
          }
        }
      }
    }

    // Update the sale record
    sale.items = items;
    sale.totalAmount = totalAmount;
    if (totalProfit !== undefined) {
      sale.totalProfit = totalProfit;
    }
    
    const updatedSale = await sale.save();

    // Update active CashSession
    const activeSession = await CashSession.findOne({ status: 'open' });
    if (activeSession) {
      activeSession.expectedCash += (totalAmount - oldAmount);
      activeSession.totalSales += (totalAmount - oldAmount);
      await activeSession.save();
    }

    res.json(updatedSale);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a sale (and reverse stock) - REQUIRE OWNER PASSWORD
router.delete('/:id', authenticate, preventSuperAdmin, verifyOwnerPassword, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const amountToDeduct = sale.totalAmount;

    // Reverse stock
    for (const item of sale.items) {
      await Item.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }

    await Sale.findByIdAndDelete(req.params.id);

    // Delete associated Invoice PDF if it exists
    const fileName = `invoice-${req.params.id}.pdf`;
    const filePath = path.join(__dirname, '..', 'invoices', fileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted invoice file: ${fileName}`);
      } catch (fileErr) {
        console.error(`Failed to delete invoice file: ${fileErr.message}`);
      }
    }

    // Update active CashSession
    const activeSession = await CashSession.findOne({ status: 'open' });
    if (activeSession) {
      activeSession.totalSales -= amountToDeduct;
      activeSession.expectedCash -= amountToDeduct;
      await activeSession.save();
    }

    res.json({ message: 'Sale deleted and stock reversed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve or Reject Bank Transfer Sale
router.patch('/:id/approve', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const { approvalStatus = 'APPROVED' } = req.body;
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    sale.approvalStatus = approvalStatus;
    await sale.save();
    res.json({ success: true, message: `Sale ${approvalStatus.toLowerCase()} successfully`, sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
