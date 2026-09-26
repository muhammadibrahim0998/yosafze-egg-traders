import express from 'express';
const router = express.Router();
import Sale from '../models/Sale.js';
import Order from '../models/Order.js';
import Item, { getBranchItemModel } from '../models/Item.js';
import CashSession from '../models/CashSession.js';
import Customer from '../models/Customer.js';
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

// Get all sales (shop admin - their shop only)
router.get('/', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const rawShopId = req.query.shopId || (req.user && req.user.shopId);
    let filter = {};
    if (rawShopId) {
      const targetShopId = await resolveShopId(rawShopId);
      if (targetShopId) {
        filter = { shopId: targetShopId };
      }
    }
    const sales = await Sale.find(filter).sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Helper function to create sale record with custom payment routing
const createSaleRecord = async (req, res, explicitPaymentData = {}) => {
  const { items, totalAmount, totalProfit, cashierName, customerName, shopId } = req.body;
  const rawShopId = req.user?.shopId || shopId;
  const targetShopId = await resolveShopId(rawShopId) || 1;
  
  try {
    // 1. Fetch current settings for the invoice
    let settings = await Settings.findOne({ shopId: targetShopId });
    if (!settings) {
      try {
        settings = await Settings.create({ shopId: targetShopId });
      } catch (sErr) {
        settings = { shopId: targetShopId };
      }
    }

    // 2. Resolve Payment Breakdown (Cash, Bank, Credit)
    const method = String(explicitPaymentData.paymentMethod || req.body.paymentMethod || 'CASH').toUpperCase();
    const isBank = method === 'BANK_TRANSFER' || method === 'BANK' || method === 'ONLINE' || method === 'EASYPAISA';
    const isCredit = method === 'CREDIT' || method === 'DUE' || explicitPaymentData.isCredit === true;

    const totalAmt = Number(totalAmount) || 0;
    let cashPaid = 0;
    let bankPaid = 0;
    let dueAmount = 0;

    if (req.body.cashPaid !== undefined || req.body.bankPaid !== undefined || req.body.dueAmount !== undefined) {
      cashPaid = Math.max(0, Number(req.body.cashPaid) || 0);
      bankPaid = Math.max(0, Number(req.body.bankPaid) || 0);
      if (req.body.dueAmount !== undefined) {
        dueAmount = Math.max(0, Number(req.body.dueAmount) || 0);
      } else {
        dueAmount = Math.max(0, totalAmt - (cashPaid + bankPaid));
      }
    } else if (method === 'CASH') {
      cashPaid = totalAmt;
      dueAmount = 0;
    } else if (isBank) {
      bankPaid = totalAmt;
      dueAmount = 0;
    } else if (isCredit) {
      dueAmount = totalAmt;
      cashPaid = 0;
      bankPaid = 0;
    } else if (method === 'SPLIT' || method === 'PARTIAL') {
      cashPaid = Number(req.body.cashPaid) || 0;
      bankPaid = Number(req.body.bankPaid) || 0;
      dueAmount = Math.max(0, totalAmt - (cashPaid + bankPaid));
    } else {
      cashPaid = totalAmt;
      dueAmount = 0;
    }

    const paymentReceipt = req.body.paymentReceipt || req.body.paymentProof || explicitPaymentData.paymentReceipt || '';

    // Generate unique serial number
    let existingCount = 0;
    try {
      existingCount = await Sale.countDocuments({ shopId: targetShopId });
    } catch (cErr) { }
    const serialNumber = 1 + existingCount;
    const invoiceNumber = `INV-${String(serialNumber).padStart(5, '0')}`;

    const salePayload = {
      shopId: targetShopId,
      items: Array.isArray(items) ? items : [],
      totalAmount: totalAmt,
      totalProfit: Number(totalProfit) || 0,
      serialNumber,
      invoiceNumber,
      cashierName: cashierName || req.user?.fullName || "Shop Admin",
      customerName: customerName || (isCredit ? "Credit Customer" : "Walk-in Customer"),
      customerPhone: req.body.customerPhone || "",
      customerEmail: req.body.customerEmail || "",
      customerId: req.body.customerId || null,
      paymentMethod: method,
      cashPaid,
      bankPaid,
      dueAmount,
      paymentReceipt,
      paymentProof: paymentReceipt,
      transactionId: req.body.transactionId || "",
      isCredit: isCredit || dueAmount > 0,
      approvalStatus: req.body.approvalStatus || (isBank ? 'PENDING_APPROVAL' : 'APPROVED'),
      saleDate: new Date()
    };
    
    // Automatically register walk-in customer in database if name is provided
    let finalCustomerName = salePayload.customerName;
    const isGeneric = !finalCustomerName || finalCustomerName.toLowerCase() === 'walk-in customer' || finalCustomerName.toLowerCase() === 'walk-in' || finalCustomerName.toLowerCase() === 'cash customer';
    
    if (!isGeneric && !salePayload.customerId) {
      try {
        const existingCust = await Customer.findOne({ fullName: finalCustomerName, shopId: targetShopId });
        if (!existingCust) {
          const newCust = await Customer.create({
            fullName: finalCustomerName,
            phone: salePayload.customerPhone || '',
            email: salePayload.customerEmail || '',
            password: 'phys_' + Math.random().toString(36).substring(7), // dummy password for physical
            shopId: targetShopId
          });
          salePayload.customerId = newCust._id || newCust.id;
        } else {
          salePayload.customerId = existingCust._id || existingCust.id;
        }
      } catch (custErr) {
        console.error('Failed to auto-register walk-in customer:', custErr);
      }
    }
    
    // 3. Update stock for each item if items provided
    if (Array.isArray(items)) {
      for (const item of items) {
        const prodId = item.productId || item._id || item.id;
        if (prodId) {
          const product = await Item.findById(prodId);
          if (product) {
            const qty = Number(item.quantity) || 1;
            const stockToDeduct = Number(item.totalEggs) > 0 ? Number(item.totalEggs) : qty;
            const newStock = Math.max(0, (Number(product.stock) || 0) - stockToDeduct);
            
            const itemUpdate = {
              stock: newStock,
              lastUpdated: new Date().toISOString().split('T')[0]
            };

            if (product.unitType === 'peti') {
              itemUpdate.petiQuantity = Math.max(0, (Number(product.petiQuantity) || 0) - qty);
            } else if (product.unitType === 'tray') {
              itemUpdate.trayQuantity = Math.max(0, (Number(product.trayQuantity) || 0) - qty);
            } else if (product.unitType === 'egg') {
              itemUpdate.eggQuantity = newStock;
            }

            await Item.findByIdAndUpdate(product.id, itemUpdate);
          }
        }
      }
    }
    
    const newSale = await Sale.create(salePayload);

    // 4. Update active CashSession
    if (cashPaid > 0) {
      try {
        const activeSession = await CashSession.findOne({ status: 'open' });
        if (activeSession) {
          await CashSession.findByIdAndUpdate(activeSession.id, {
            totalSales: (Number(activeSession.totalSales) || 0) + cashPaid,
            expectedCash: (Number(activeSession.expectedCash) || 0) + cashPaid
          });
        }
      } catch (csErr) { }
    }

    // 5. Generate PDF Invoice
    const fileName = `invoice-${newSale._id || newSale.id}.pdf`;
    const invoicesDir = path.join(__dirname, '..', 'invoices');
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }
    const filePath = path.join(invoicesDir, fileName);
    
    try {
      await generateInvoice(newSale, filePath, settings);
      const responseData = typeof newSale.toObject === 'function' ? newSale.toObject() : { ...newSale };
      responseData.invoiceUrl = `/invoices/${fileName}`;
      res.status(201).json(responseData);
    } catch (pdfErr) {
      const responseData = typeof newSale.toObject === 'function' ? newSale.toObject() : { ...newSale };
      res.status(201).json(responseData);
    }
  } catch (err) {
    console.error('[createSaleRecord error]:', err);
    res.status(500).json({ message: err.message });
  }
};

// Create a standard sale
router.post('/', authenticate, requireShopAdmin, async (req, res) => {
  await createSaleRecord(req, res);
});

// ── DEDICATED ROUTE 1: CASH SALE ──
router.post('/cash', authenticate, requireShopAdmin, async (req, res) => {
  await createSaleRecord(req, res, { paymentMethod: 'CASH' });
});

// ── DEDICATED ROUTE 2: BANK / ONLINE SALE WITH RECEIPT PROOF ──
router.post('/bank', authenticate, requireShopAdmin, async (req, res) => {
  await createSaleRecord(req, res, { paymentMethod: 'BANK_TRANSFER' });
});

router.post('/online', authenticate, requireShopAdmin, async (req, res) => {
  await createSaleRecord(req, res, { paymentMethod: 'ONLINE' });
});

// ── DEDICATED ROUTE 3: CREDIT (DUE BALANCE) SALE ──
router.post('/credit', authenticate, requireShopAdmin, async (req, res) => {
  await createSaleRecord(req, res, { paymentMethod: 'CREDIT', isCredit: true });
});

router.post('/due', authenticate, requireShopAdmin, async (req, res) => {
  await createSaleRecord(req, res, { paymentMethod: 'CREDIT', isCredit: true });
});

// ── SALES BREAKDOWN & SUMMARY ROUTE (Cash, Bank, Credit) ──
router.get('/breakdown/:shopId?', authenticate, async (req, res) => {
  try {
    const rawShopId = req.params.shopId || req.query.shopId || req.user?.shopId;
    let filter = {};
    if (rawShopId) {
      const targetShopId = await resolveShopId(rawShopId);
      if (targetShopId) {
        filter = { shopId: targetShopId };
      }
    }
    const allSales = await Sale.find(filter);

    let totalCash = 0;
    let totalBank = 0;
    let totalCredit = 0;
    let totalGrossSales = 0;

    allSales.forEach(s => {
      totalGrossSales += (Number(s.totalAmount) || 0);
      if (s.cashPaid !== undefined || s.bankPaid !== undefined || s.dueAmount !== undefined) {
        totalCash += (Number(s.cashPaid) || 0);
        totalBank += (Number(s.bankPaid) || 0);
        totalCredit += (Number(s.dueAmount) || 0);
      } else {
        // Fallback for older sales
        const m = String(s.paymentMethod || 'CASH').toUpperCase();
        if (m === 'CASH') totalCash += (Number(s.totalAmount) || 0);
        else if (m === 'BANK_TRANSFER' || m === 'BANK' || m === 'ONLINE' || m === 'EASYPAISA') totalBank += (Number(s.totalAmount) || 0);
        else if (m === 'CREDIT' || m === 'DUE') totalCredit += (Number(s.totalAmount) || 0);
        else totalCash += (Number(s.totalAmount) || 0);
      }
    });

    res.json({
      success: true,
      totalGrossSales,
      totalCash,
      totalBank,
      totalCredit,
      totalCount: allSales.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET SALES FILTERED BY TYPE (cash | bank | credit) ──
router.get('/by-type/:type', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const type = req.params.type.toLowerCase();
    const rawShopId = req.query.shopId || req.user?.shopId;
    let filter = {};
    if (rawShopId) {
      const targetShopId = await resolveShopId(rawShopId);
      if (targetShopId) {
        filter.shopId = targetShopId;
      }
    }

    if (type === 'cash') {
      filter.$or = [{ paymentMethod: 'CASH' }, { cashPaid: { $gt: 0 } }];
    } else if (type === 'bank' || type === 'online') {
      filter.$or = [{ paymentMethod: { $in: ['BANK_TRANSFER', 'BANK', 'ONLINE', 'EASYPAISA'] } }, { bankPaid: { $gt: 0 } }];
    } else if (type === 'credit' || type === 'due') {
      filter.$or = [{ paymentMethod: { $in: ['CREDIT', 'DUE'] } }, { isCredit: true }, { dueAmount: { $gt: 0 } }];
    }

    const sales = await Sale.find(filter).sort({ saleDate: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Return a sale (and reverse stock)
router.put('/:id/return', authenticate, requireShopAdmin, async (req, res) => {
  const { reason } = req.body;
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale || sale.status === 'returned') {
      return res.status(404).json({ message: 'Sale not found or already returned' });
    }

    // 1. Reverse stock for each item
    for (const item of (sale.items || [])) {
      const pId = item.productId || item.id || item._id;
      if (pId) {
        const product = await Item.findById(pId);
        if (product) {
          const qty = Number(item.quantity) || 1;
          const stockToAdd = Number(item.totalEggs) > 0 ? Number(item.totalEggs) : qty;
          const newStock = (Number(product.stock) || 0) + stockToAdd;
          const updateObj = { stock: newStock, lastUpdated: new Date().toISOString().split('T')[0] };
          if (product.unitType === 'peti') {
            updateObj.petiQuantity = (Number(product.petiQuantity) || 0) + qty;
          } else if (product.unitType === 'tray') {
            updateObj.trayQuantity = (Number(product.trayQuantity) || 0) + qty;
          } else if (product.unitType === 'egg') {
            updateObj.eggQuantity = newStock;
          }
          await Item.findByIdAndUpdate(product.id, updateObj);
        }
      }
    }

    // 2. Update sale record in MySQL
    const updatedSale = await Sale.findByIdAndUpdate(sale.id, {
      status: 'returned',
      returnReason: reason || "Customer Return",
      returnDate: new Date()
    }, { new: true });

    // 3. Update active CashSession
    if (Number(sale.cashPaid) > 0) {
      try {
        const activeSession = await CashSession.findOne({ status: 'open' });
        if (activeSession) {
          await CashSession.findByIdAndUpdate(activeSession.id, {
            totalReturns: (Number(activeSession.totalReturns) || 0) + Number(sale.cashPaid),
            expectedCash: Math.max(0, (Number(activeSession.expectedCash) || 0) - Number(sale.cashPaid))
          });
        }
      } catch (e) { }
    }

    res.json(updatedSale);
  } catch (err) {
    console.error('Return sale error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Edit a sale (and adjust stock)
router.put('/:id', authenticate, requireShopAdmin, async (req, res) => {
  const { items, totalAmount, totalProfit, customerName, customerPhone, customerEmail, paymentMethod, cashPaid, bankPaid, dueAmount } = req.body;
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const oldCashPaid = Number(sale.cashPaid) || 0;

    // Adjust stock differences if items are edited
    if (Array.isArray(items) && Array.isArray(sale.items)) {
      for (const newItem of items) {
        const oldItem = sale.items.find(i => String(i.productId || i.id || i._id) === String(newItem.productId || newItem.id || newItem._id));
        if (oldItem) {
          const qtyDifference = (Number(newItem.quantity) || 1) - (Number(oldItem.quantity) || 1);
          if (qtyDifference !== 0) {
            const product = await Item.findById(newItem.productId || newItem.id || newItem._id);
            if (product) {
              const stockDiff = Number(newItem.totalEggs) > 0 ? (Number(newItem.totalEggs) - (Number(oldItem.totalEggs) || 0)) : qtyDifference;
              const newStock = Math.max(0, (Number(product.stock) || 0) - stockDiff);
              await Item.findByIdAndUpdate(product.id, { stock: newStock, lastUpdated: new Date().toISOString().split('T')[0] });
            }
          }
        }
      }
    }

    const updateData = {};
    if (items !== undefined) updateData.items = items;
    if (totalAmount !== undefined) updateData.totalAmount = Number(totalAmount);
    if (totalProfit !== undefined) updateData.totalProfit = Number(totalProfit);
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (cashPaid !== undefined) updateData.cashPaid = Number(cashPaid);
    if (bankPaid !== undefined) updateData.bankPaid = Number(bankPaid);
    if (dueAmount !== undefined) {
      updateData.dueAmount = Number(dueAmount);
      updateData.isCredit = Number(dueAmount) > 0;
    }

    const updatedSale = await Sale.findByIdAndUpdate(sale.id, updateData, { new: true });

    // Update active CashSession if cash amount changed
    if (cashPaid !== undefined && cashPaid !== oldCashPaid) {
      try {
        const activeSession = await CashSession.findOne({ status: 'open' });
        if (activeSession) {
          const diff = Number(cashPaid) - oldCashPaid;
          await CashSession.findByIdAndUpdate(activeSession.id, {
            totalSales: Math.max(0, (Number(activeSession.totalSales) || 0) + diff),
            expectedCash: Math.max(0, (Number(activeSession.expectedCash) || 0) + diff)
          });
        }
      } catch (e) { }
    }

    res.json(updatedSale);
  } catch (err) {
    console.error('Edit sale error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete a sale permanently from database (both Sale and Order if exists)
router.delete('/:id', authenticate, requireShopAdmin, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return res.status(400).json({ message: 'Target ID is required' });
    }

    let sale = await Sale.findById(targetId);
    if (!sale) {
      sale = await Sale.findOne({ invoiceNumber: targetId });
    }
    if (!sale) {
      sale = await Sale.findOne({ orderId: targetId });
    }

    if (sale) {
      const amountToDeduct = Number(sale.cashPaid || sale.totalAmount) || 0;

      // 1. Reverse inventory stock
      for (const item of (sale.items || [])) {
        const pId = item.productId || item.id || item._id;
        if (pId) {
          try {
            const product = await Item.findById(pId);
            if (product) {
              const qty = Number(item.quantity) || 1;
              const stockToAdd = Number(item.totalEggs) > 0 ? Number(item.totalEggs) : qty;
              const newStock = (Number(product.stock) || 0) + stockToAdd;
              const updateObj = { stock: newStock, lastUpdated: new Date().toISOString().split('T')[0] };
              if (product.unitType === 'peti') {
                updateObj.petiQuantity = (Number(product.petiQuantity) || 0) + qty;
              } else if (product.unitType === 'tray') {
                updateObj.trayQuantity = (Number(product.trayQuantity) || 0) + qty;
              } else if (product.unitType === 'egg') {
                updateObj.eggQuantity = newStock;
              }
              await Item.findByIdAndUpdate(product.id, updateObj);
            }
          } catch (e) { }
        }
      }

      // 2. Delete from MySQL sales and sale_items
      await Sale.findByIdAndDelete(sale.id);

      // 3. Delete associated Invoice PDF if it exists
      const fileName = `invoice-${sale.id || sale._id}.pdf`;
      const filePath = path.join(__dirname, '..', 'invoices', fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileErr) { }
      }

      // 4. Update active CashSession
      if (amountToDeduct > 0) {
        try {
          const activeSession = await CashSession.findOne({ status: 'open' });
          if (activeSession) {
            await CashSession.findByIdAndUpdate(activeSession.id, {
              totalSales: Math.max(0, (Number(activeSession.totalSales) || 0) - amountToDeduct),
              expectedCash: Math.max(0, (Number(activeSession.expectedCash) || 0) - amountToDeduct)
            });
          }
        } catch (e) { }
      }

      // 5. Delete linked order if any
      if (sale.orderId) {
        try {
          await Order.findByIdAndDelete(sale.orderId);
        } catch (e) { }
      }
    }

    // Also check Order collection directly
    try {
      await Order.findByIdAndDelete(targetId);
    } catch (ordErr) { }

    res.json({ success: true, message: 'Sale and associated records permanently deleted from database' });
  } catch (err) {
    console.error('Delete sale error:', err);
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

// Helper logic for executing credit settlement
const processCreditSettlement = async (saleId, { paymentMethod = 'CASH', amountPaid, transactionId, paymentProof, paymentReceipt }, res) => {
  try {
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const currentDue = Number(sale.dueAmount) > 0 ? Number(sale.dueAmount) : Number(sale.totalAmount);
    const settleAmount = amountPaid ? Math.min(Number(amountPaid), currentDue) : currentDue;

    if (settleAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const method = String(paymentMethod).toUpperCase();
    const isBank = method === 'BANK_TRANSFER' || method === 'BANK' || method === 'ONLINE' || method === 'EASYPAISA';

    if (isBank) {
      sale.bankPaid = (Number(sale.bankPaid) || 0) + settleAmount;
      if (transactionId) sale.transactionId = transactionId;
      if (paymentProof || paymentReceipt) {
        sale.paymentProof = paymentProof || paymentReceipt;
        sale.paymentReceipt = paymentProof || paymentReceipt;
      }
    } else {
      // CASH
      sale.cashPaid = (Number(sale.cashPaid) || 0) + settleAmount;
      
      // Update active CashSession
      const activeSession = await CashSession.findOne({ status: 'open' });
      if (activeSession) {
        activeSession.totalSales = (Number(activeSession.totalSales) || 0) + settleAmount;
        activeSession.expectedCash = (Number(activeSession.expectedCash) || 0) + settleAmount;
        await activeSession.save();
      }
    }

    const newDue = Math.max(0, currentDue - settleAmount);
    sale.dueAmount = newDue;
    sale.isCredit = newDue > 0;
    
    // If fully paid, update paymentMethod according to what was paid
    if (newDue === 0) {
      if ((Number(sale.bankPaid) || 0) > 0 && (Number(sale.cashPaid) || 0) === 0) {
        sale.paymentMethod = 'BANK_TRANSFER';
      } else if ((Number(sale.cashPaid) || 0) > 0 && (Number(sale.bankPaid) || 0) === 0) {
        sale.paymentMethod = 'CASH';
      } else if ((Number(sale.cashPaid) || 0) > 0 && (Number(sale.bankPaid) || 0) > 0) {
        sale.paymentMethod = 'SPLIT';
      } else {
        sale.paymentMethod = isBank ? 'BANK_TRANSFER' : 'CASH';
      }
    }

    const updatedSale = await Sale.findByIdAndUpdate(sale.id, sale, { new: true });

    // Also sync with customer_credits table in MySQL
    try {
      const mysqlModule = await import('../config/mysql.js');
      const pool = mysqlModule.default;
      const status = newDue <= 0 ? 'PAID' : ((Number(sale.cashPaid) || 0) + (Number(sale.bankPaid) || 0) > 0 ? 'PARTIAL' : 'UNPAID');
      
      const { ALL_BRANCH_PREFIXES } = await import('../models/dbHelper.js');
      for (const prefix of ALL_BRANCH_PREFIXES) {
        try {
          await pool.query(
            `UPDATE \`${prefix}__customer_credits\` SET paidAmount = ?, dueAmount = ?, status = ?, lastPaymentDate = NOW() WHERE saleId = ?`,
            [(Number(sale.cashPaid) || 0) + (Number(sale.bankPaid) || 0), newDue, status, sale.id]
          );
        } catch (e) { }
      }
    } catch (ccErr) { }

    // Also update Order if it corresponds to an order
    try {
      const order = await Order.findById(saleId);
      if (order) {
        if (newDue === 0) {
          order.paymentStatus = 'PAID';
        }
        order.paymentMethod = sale.paymentMethod;
        await Order.findByIdAndUpdate(order.id, order);
      }
    } catch (e) { }

    return res.json({
      success: true,
      message: `Credit of Rs. ${settleAmount.toLocaleString('en-PK')} settled via ${isBank ? 'Bank Transfer' : 'Cash'}`,
      sale: updatedSale || sale
    });
  } catch (err) {
    console.error('Settle credit error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── DEDICATED ROUTE 1: SETTLE CREDIT VIA CASH ──
router.patch('/:id/settle-cash', authenticate, requireShopAdmin, async (req, res) => {
  await processCreditSettlement(req.params.id, { ...req.body, paymentMethod: 'CASH' }, res);
});

// ── DEDICATED ROUTE 2: SETTLE CREDIT VIA BANK TRANSFER ──
router.patch('/:id/settle-bank', authenticate, requireShopAdmin, async (req, res) => {
  await processCreditSettlement(req.params.id, { ...req.body, paymentMethod: 'BANK_TRANSFER' }, res);
});

// ── UPDATE CUSTOMER DETAILS ACROSS SALES ──
router.put('/update-customer-info', async (req, res) => {
  try {
    const { saleIds, oldCustomerName, oldCustomerPhone, oldCustomerEmail, newCustomerName, newCustomerPhone, newCustomerEmail } = req.body;
    
    const updateFields = {};
    if (newCustomerName) updateFields.customerName = newCustomerName.trim();
    if (newCustomerPhone !== undefined) updateFields.customerPhone = newCustomerPhone.trim();
    if (newCustomerEmail !== undefined) updateFields.customerEmail = newCustomerEmail.trim().toLowerCase();

    const queryOr = [];
    if (Array.isArray(saleIds) && saleIds.length > 0) {
      queryOr.push({ _id: { $in: saleIds } });
    }
    if (oldCustomerName && oldCustomerName.trim()) {
      queryOr.push({ customerName: new RegExp(`^${oldCustomerName.trim()}$`, 'i') });
    }
    if (oldCustomerPhone && oldCustomerPhone.trim()) {
      queryOr.push({ customerPhone: oldCustomerPhone.trim() });
    }
    if (oldCustomerEmail && oldCustomerEmail.trim() && oldCustomerEmail !== 'physical store pos') {
      queryOr.push({ customerEmail: oldCustomerEmail.trim().toLowerCase() });
    }

    if (queryOr.length > 0) {
      await Sale.updateMany(
        { $or: queryOr },
        { $set: updateFields }
      );
    }

    res.json({ success: true, message: 'Customer details updated successfully across sales' });
  } catch (err) {
    console.error('Update sales customer info error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
