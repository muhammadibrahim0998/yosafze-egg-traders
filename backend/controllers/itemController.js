import Item, { getBranchItemModel, syncBranchProducts } from '../models/Item.js';
import Expense from '../models/Expense.js';
import Purchase from '../models/Purchase.js';
import PurchaseCredit from '../models/PurchaseCredit.js';
import Vendor from '../models/Vendor.js';
import pool from '../config/mysql.js';
import { logSystemUpdate } from '../utils/updateHelper.js';
import { resolveShopId } from '../utils/shopResolver.js';

// @desc    Get all items (dynamically scoped per branch)
const getItems = async (req, res) => {
  try {
    const rawShopId = req.query.shopId || (req.user?.role !== 'super_admin' ? (req.user?.shopId?._id || req.user?.shopId) : null);
    let targetShopId = null;

    if (rawShopId) {
      targetShopId = await resolveShopId(rawShopId) || rawShopId;
    } else if (req.user?.shopId) {
      const userShop = req.user.shopId?._id || req.user.shopId;
      targetShopId = await resolveShopId(userShop) || userShop;
    }

    let items = [];
    if (targetShopId) {
      items = await Item.find({ shopId: targetShopId }).sort({ createdAt: -1 });
    } else {
      // Super Admin viewing global items across all shops
      items = await Item.find({}).sort({ createdAt: -1 });
    }

    const normalized = items.map(item => {
      const itemObj = typeof item.toObject === 'function' ? item.toObject() : { ...item };
      const pMethod = String(itemObj.paymentMethod || '').trim().toLowerCase();
      const isBankMethod = (
        pMethod.includes('bank') || pMethod.includes('easy') || pMethod.includes('jazz') || pMethod.includes('online') || pMethod.includes('cheque') || pMethod.includes('transfer') || pMethod.includes('card')
      );
      const isOnline = isBankMethod || itemObj.isOnlinePayment === true;
      itemObj.isOnlinePayment = isOnline;

      const petiQty = Number(itemObj.petiQuantity) || 0;
      const stock = Number(itemObj.stock) || 0;
      const unitCost = Number(itemObj.costPrice) > 0 ? Number(itemObj.costPrice) : Number(itemObj.price || 0);
      const unitDivisor = itemObj.unitType === 'egg' ? 1 : itemObj.unitType === 'tray' ? 30 : 360;

      const calculatedCost = Number(itemObj.totalPurchaseCost) > 0
        ? Number(itemObj.totalPurchaseCost)
        : (petiQty > 0 ? petiQty * unitCost : (stock > 0 ? stock * (unitCost / unitDivisor) : 0));
      
      itemObj.totalPurchaseCost = Math.round(calculatedCost);

      const isCreditMethod = pMethod.includes('credit') || pMethod.includes('due') || pMethod.includes('partial');
      const hasExplicitDue = itemObj.dueAmountToSupplier !== undefined && itemObj.dueAmountToSupplier !== null && Number(itemObj.dueAmountToSupplier) >= 0;

      if (hasExplicitDue || isCreditMethod) {
        const rawDue = hasExplicitDue ? Number(itemObj.dueAmountToSupplier) : itemObj.totalPurchaseCost;
        itemObj.dueAmountToSupplier = Math.min(itemObj.totalPurchaseCost, Math.max(0, rawDue));
        itemObj.amountPaidToSupplier = Math.max(0, itemObj.totalPurchaseCost - itemObj.dueAmountToSupplier);
      } else {
        // 100% Paid (No Credit)
        itemObj.amountPaidToSupplier = itemObj.totalPurchaseCost;
        itemObj.dueAmountToSupplier = 0;
      }

      // Separate Cash vs Bank
      let cashP = Number(itemObj.cashPaidToSupplier) || 0;
      let bankP = Number(itemObj.bankPaidToSupplier) || 0;
      if (cashP === 0 && bankP === 0 && itemObj.amountPaidToSupplier > 0) {
        if (isOnline) {
          bankP = itemObj.amountPaidToSupplier;
        } else {
          cashP = itemObj.amountPaidToSupplier;
        }
      }
      itemObj.cashPaidToSupplier = cashP;
      itemObj.bankPaidToSupplier = bankP;

      return itemObj;
    });
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single item
const getItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const filter = (req.user?.role === 'super_admin' || !req.user?.shopId)
      ? { id }
      : { id, shopId: req.user.shopId };

    const item = await Item.findOne(filter);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new item
const createItem = async (req, res) => {
  try {
    let rawShopId = req.body.shopId || (req.user?.shopId?._id || req.user?.shopId) || req.query?.shopId || req.headers['x-shop-id'];
    const resolvedShopId = await resolveShopId(rawShopId);
    const shopId = resolvedShopId ? Number(resolvedShopId) : (rawShopId ? Number(rawShopId) : null);
    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required to add a product' });
    }
    const finalImages = (req.body.images && req.body.images.length > 0) ? req.body.images : ['/egg2.png'];
    const pMethod = String(req.body.paymentMethod || '').trim().toLowerCase();
    const isBankMethod = (
      pMethod.includes('bank') || pMethod.includes('easy') || pMethod.includes('jazz') || pMethod.includes('online') || pMethod.includes('cheque') || pMethod.includes('transfer') || pMethod.includes('card')
    );
    const isOnline = isBankMethod || req.body.isOnlinePayment === true;

    const totalCost = Number(req.body.totalPurchaseCost || 0);
    const paidAmt = Number(req.body.amountPaidToSupplier || 0);
    const dueAmt = req.body.dueAmountToSupplier !== undefined 
      ? Number(req.body.dueAmountToSupplier)
      : Math.max(0, totalCost - paidAmt);

    const cashPaid = req.body.cashPaidToSupplier !== undefined ? Number(req.body.cashPaidToSupplier) : (isOnline ? 0 : paidAmt);
    const bankPaid = req.body.bankPaidToSupplier !== undefined ? Number(req.body.bankPaidToSupplier) : (isOnline ? paidAmt : 0);

    const newItemData = { 
      ...req.body, 
      images: finalImages, 
      shopId,
      isOnlinePayment: isOnline,
      totalPurchaseCost: totalCost,
      amountPaidToSupplier: paidAmt,
      cashPaidToSupplier: cashPaid,
      bankPaidToSupplier: bankPaid,
      dueAmountToSupplier: dueAmt
    };
    
    // Save to Item model
    const newItem = await Item.create(newItemData);
    
    // Auto-resolve or register Vendor ID
    let vendorId = req.body.vendorId || null;
    const sName = (newItem.supplierName || req.body.supplierName || '').trim();
    if (sName) {
      try {
        let v = await Vendor.findOne({ name: sName, shopId });
        if (!v) {
          v = await Vendor.findOne({ name: { $regex: sName } });
        }
        if (!v) {
          v = await Vendor.create({
            name: sName,
            phone: newItem.supplierPhone || req.body.supplierPhone || '03069578493',
            location: newItem.supplierLocation || req.body.supplierLocation || '',
            shopId
          });
        }
        if (v && v.id) {
          vendorId = v.id;
        }
      } catch (_) {}
    }

    // Auto-create purchase record in purchases table for this branch
    try {
      await Purchase.create({
        shopId: newItem.shopId,
        itemId: newItem.id,
        vendorId: vendorId || null,
        productName: newItem.name,
        supplierName: newItem.supplierName || sName || '',
        supplierPhone: newItem.supplierPhone || '',
        supplierLocation: newItem.supplierLocation || '',
        petiQuantity: Number(newItem.petiQuantity) || 0,
        trayQuantity: Number(newItem.trayQuantity) || 0,
        eggQuantity: Number(newItem.eggQuantity) || (Number(newItem.stock) || 0),
        unitType: newItem.unitType || 'peti',
        buyCost: Number(newItem.costPrice) || Number(newItem.price) || 0,
        totalCost: Number(newItem.totalPurchaseCost) || 0,
        paymentType: newItem.paymentMethod || 'Cash',
        amountPaid: Number(newItem.amountPaidToSupplier) || 0,
        dueAmount: Number(newItem.dueAmountToSupplier) || 0,
        paymentReceipt: newItem.paymentReceipt || '',
        notes: `Purchase Restock: ${newItem.name}`
      });
    } catch (purchErr) {
      console.error('[createItem] Purchase record creation failed:', purchErr.message);
    }

    // Auto-create purchase_credits record if there is due balance for supplier
    if (Number(newItem.dueAmountToSupplier) > 0) {
      try {
        await PurchaseCredit.create({
          shopId: newItem.shopId,
          itemId: newItem.id,
          vendorId: vendorId || null,
          productName: newItem.name,
          supplierName: newItem.supplierName || sName || 'Egg Supplier',
          supplierPhone: newItem.supplierPhone || '',
          supplierLocation: newItem.supplierLocation || '',
          quantityText: [
            newItem.petiQuantity > 0 ? `${newItem.petiQuantity} Petis` : '',
            newItem.trayQuantity > 0 ? `${newItem.trayQuantity} Trays` : '',
            newItem.eggQuantity > 0 ? `${newItem.eggQuantity} Eggs` : ''
          ].filter(Boolean).join(', ') || '0',
          totalCost: Number(newItem.totalPurchaseCost) || 0,
          paidToDate: Number(newItem.amountPaidToSupplier) || 0,
          pendingDue: Number(newItem.dueAmountToSupplier) || 0,
          status: Number(newItem.amountPaidToSupplier) > 0 ? 'PARTIAL' : 'UNPAID',
          paymentMethod: newItem.paymentMethod || 'Credit',
          paymentReceipt: newItem.paymentReceipt || ''
        });
      } catch (pcErr) {
        console.error('[createItem] Purchase Credit record creation failed:', pcErr.message);
      }
    }

    // Auto-create expense record if payment was made to supplier
    if (newItem.amountPaidToSupplier && newItem.amountPaidToSupplier > 0) {
      try {
        await Expense.create({
          shopId: newItem.shopId,
          title: `Supplier Payment - ${newItem.supplierName || 'Egg Farm/Supplier'} (${newItem.name})`,
          category: 'Other',
          amount: Number(newItem.amountPaidToSupplier),
          notes: `Paid via ${newItem.paymentMethod || 'Cash'} for egg inventory purchase (${newItem.name}). Due Balance: Rs ${newItem.dueAmountToSupplier || 0}`,
          createdBy: req.user?.fullName || 'Shop Admin'
        });
      } catch (expErr) {
        console.error('[createItem] Expense creation failed:', expErr.message);
      }
    }

    // Log system update for new product
    await logSystemUpdate(
      "New Features", 
      "zap", 
      `New Product deployed: ${newItem.name} (${newItem.category})`
    );

    res.status(201).json(newItem);
  } catch (error) {
    console.error('[createItem error]', error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const updateData = { ...req.body };
    const pMethod = String(req.body.paymentMethod || '').trim().toLowerCase();
    const isBankMethod = (
      pMethod.includes('bank') || pMethod.includes('easy') || pMethod.includes('jazz') || pMethod.includes('online') || pMethod.includes('cheque') || pMethod.includes('transfer') || pMethod.includes('card')
    );
    const isOnline = isBankMethod || req.body.isOnlinePayment === true;
    updateData.isOnlinePayment = isOnline;

    if (req.body.totalPurchaseCost !== undefined || req.body.amountPaidToSupplier !== undefined || req.body.dueAmountToSupplier !== undefined) {
      const totalCost = Number(req.body.totalPurchaseCost || 0);
      const paidAmt = Number(req.body.amountPaidToSupplier || 0);
      const dueAmt = req.body.dueAmountToSupplier !== undefined 
        ? Number(req.body.dueAmountToSupplier)
        : Math.max(0, totalCost - paidAmt);

      updateData.totalPurchaseCost = totalCost;
      updateData.amountPaidToSupplier = paidAmt;
      updateData.dueAmountToSupplier = dueAmt;

      if (req.body.cashPaidToSupplier !== undefined || req.body.bankPaidToSupplier !== undefined) {
        updateData.cashPaidToSupplier = Number(req.body.cashPaidToSupplier) || 0;
        updateData.bankPaidToSupplier = Number(req.body.bankPaidToSupplier) || 0;
      } else {
        updateData.cashPaidToSupplier = isOnline ? 0 : paidAmt;
        updateData.bankPaidToSupplier = isOnline ? paidAmt : 0;
      }
    }

    if (req.body.images !== undefined) {
      if (Array.isArray(req.body.images) && req.body.images.length > 0 && req.body.images[0]) {
        updateData.images = req.body.images;
      } else if (typeof req.body.images === 'string' && req.body.images.trim()) {
        updateData.images = [req.body.images.trim()];
      } else {
        const existing = await Item.findById(id);
        updateData.images = (existing?.images && existing.images.length > 0 && existing.images[0]) ? existing.images : ['/egg2.png'];
      }
    }

    const existing = await Item.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found in database' });
    }

    const updatedItem = await Item.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Failed to update product in database' });

    // Also sync updates to purchases and purchase_credits tables in MySQL if relevant
    try {
      if (updateData.name || updateData.price !== undefined || updateData.costPrice !== undefined || updateData.stock !== undefined) {
        await pool.query(
          'UPDATE purchases SET name = COALESCE(?, name), price = COALESCE(?, price), costPrice = COALESCE(?, costPrice), quantity = COALESCE(?, quantity) WHERE itemId = ? OR id = ?',
          [updateData.name || null, updateData.price !== undefined ? updateData.price : null, updateData.costPrice !== undefined ? updateData.costPrice : null, updateData.stock !== undefined ? updateData.stock : null, id, id]
        );
      }
    } catch (pSyncErr) {
      console.error('[updateItem] purchases sync error:', pSyncErr.message);
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete item & sync deletion with purchase_credits and purchases tables
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const item = await Item.findByIdAndDelete(id);

    // Also delete from purchase_credits and purchases tables in MySQL
    try {
      await pool.query('DELETE FROM purchase_credits WHERE itemId = ? OR id = ?', [id, id]);
    } catch (pcErr) {
      console.error('[deleteItem] purchase_credits delete error:', pcErr.message);
    }

    try {
      await pool.query('DELETE FROM purchases WHERE itemId = ? OR id = ?', [id, id]);
    } catch (pErr) {
      console.error('[deleteItem] purchases delete error:', pErr.message);
    }

    try {
      await pool.query('DELETE FROM damaged_products WHERE itemId = ?', [id]);
    } catch (_) {}

    res.json({ message: 'Item and purchase credit records deleted successfully from database', deletedId: id, existed: !!item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Purchase Credit record directly
const deletePurchaseCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const creditId = id || req.body?.id || req.body?.creditId || req.body?.itemId;
    if (!creditId || creditId === 'undefined' || creditId === 'null') {
      return res.status(400).json({ message: 'Valid ID is required' });
    }

    // Delete from purchase_credits table
    try {
      await pool.query('DELETE FROM purchase_credits WHERE id = ? OR itemId = ?', [creditId, creditId]);
    } catch (pcErr) {
      console.error('[deletePurchaseCredit] purchase_credits table delete error:', pcErr.message);
    }

    // Also delete from purchases and items if matching
    try {
      await pool.query('DELETE FROM purchases WHERE id = ? OR itemId = ?', [creditId, creditId]);
    } catch (_) {}

    try {
      await Item.findByIdAndDelete(creditId);
    } catch (_) {}

    res.json({ success: true, message: 'Purchase credit record deleted successfully from database', deletedId: creditId });
  } catch (error) {
    console.error('[deletePurchaseCredit error]', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Settle Supplier Credit (Due) via Cash or Bank Transfer
const settleSupplierCredit = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const { paymentMethod = 'Cash', amountPaid, paymentReceipt } = req.body;
    const filter = (req.user?.role === 'super_admin' || !req.user?.shopId)
      ? { id }
      : { id, shopId: req.user.shopId };

    const item = await Item.findOne(filter);
    if (!item) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const unitCost = Number(item.costPrice) > 0 ? Number(item.costPrice) : Number(item.price || 0);
    const unitDivisor = item.unitType === 'egg' ? 1 : item.unitType === 'tray' ? 30 : 360;
    const petiQty = Number(item.petiQuantity) || 0;
    const stockEggs = Number(item.stock) || 0;

    const totalCost = Number(item.totalPurchaseCost) > 0
      ? Number(item.totalPurchaseCost)
      : (petiQty > 0 ? petiQty * unitCost : (stockEggs > 0 ? stockEggs * (unitCost / unitDivisor) : 0));

    const explicitDue = (item.dueAmountToSupplier !== undefined && item.dueAmountToSupplier !== null)
      ? Number(item.dueAmountToSupplier)
      : null;

    const currentDue = (explicitDue !== null)
      ? explicitDue
      : Math.max(0, totalCost - (Number(item.amountPaidToSupplier) || 0));

    let payAmt = Number(amountPaid);
    if (isNaN(payAmt) || payAmt <= 0) {
      payAmt = currentDue > 0 ? currentDue : 0;
    }
    if (payAmt <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const isBank = String(paymentMethod).toLowerCase().includes('bank') || String(paymentMethod).toLowerCase().includes('online') || String(paymentMethod).toLowerCase().includes('transfer');
    const effectiveDue = currentDue > 0 ? currentDue : payAmt;
    const newDue = Math.max(0, effectiveDue - payAmt);
    const newPaid = (Number(item.amountPaidToSupplier) || 0) + payAmt;

    const updatePayload = {
      dueAmountToSupplier: newDue,
      amountPaidToSupplier: newPaid,
      totalPurchaseCost: Math.max(totalCost, newPaid + newDue),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (isBank) {
      updatePayload.bankPaidToSupplier = (Number(item.bankPaidToSupplier) || 0) + payAmt;
      updatePayload.isOnlinePayment = true;
      if (paymentReceipt) updatePayload.paymentReceipt = paymentReceipt;
      updatePayload.paymentMethod = 'Bank Transfer';
    } else {
      updatePayload.cashPaidToSupplier = (Number(item.cashPaidToSupplier) || 0) + payAmt;
      if ((Number(item.bankPaidToSupplier) || 0) === 0) {
        updatePayload.isOnlinePayment = false;
        updatePayload.paymentMethod = 'Cash';
      }
    }

    const updatedItem = await Item.findByIdAndUpdate(item.id, updatePayload);

    // Sync with purchase_credits and purchases tables
    try {
      const pcStatus = newDue <= 0 ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'UNPAID');
      await pool.query(
        'UPDATE purchase_credits SET paidToDate = ?, pendingDue = ?, status = ?, lastSettlementDate = NOW() WHERE itemId = ?',
        [newPaid, newDue, pcStatus, item.id]
      );
      await pool.query(
        'UPDATE purchases SET amountPaid = ?, dueAmount = ?, updatedAt = NOW() WHERE itemId = ?',
        [newPaid, newDue, item.id]
      );
    } catch (pcErr) { }

    // Auto-create expense record for supplier payment
    try {
      await Expense.create({
        shopId: item.shopId,
        title: `Supplier Credit Paid - ${item.supplierName || 'Egg Farm'} (${item.name})`,
        category: 'Other',
        amount: payAmt,
        paymentMethod: isBank ? 'BANK_TRANSFER' : 'CASH',
        paymentSource: isBank ? 'BANK' : 'CASH',
        notes: `Paid Rs ${payAmt} via ${isBank ? 'Bank Transfer' : 'Cash'} for ${item.name} supplier credit. Remaining Due: Rs ${newDue}`,
        createdBy: req.user?.fullName || 'Shop Admin'
      });
    } catch (expErr) {
      console.error('[settleSupplierCredit Expense Error]', expErr);
    }

    res.json({
      success: true,
      message: `Supplier Credit of Rs. ${payAmt.toLocaleString('en-PK')} paid via ${isBank ? 'Bank Transfer' : 'Cash'}`,
      item: updatedItem
    });
  } catch (error) {
    console.error('[settleSupplierCredit error]', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Vendor / Supplier details across database
const updateVendor = async (req, res) => {
  try {
    const { oldName, name, phone, location, email, notes, shopId } = req.body;
    const targetShopId = shopId || req.user?.shopId || null;

    if (!oldName && !name) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }

    const currentName = (oldName || name || '').trim();
    const newName = (name || oldName || '').trim();
    const newPhone = (phone || '').trim();
    const newLocation = (location || '').trim();

    // 1. Update/Upsert vendors table
    try {
      const [existingVendors] = await pool.query(
        'SELECT * FROM vendors WHERE (name = ? OR name = ?) AND (shopId = ? OR ? IS NULL)',
        [currentName, newName, targetShopId, targetShopId]
      );

      if (existingVendors.length > 0) {
        await pool.query(
          `UPDATE vendors 
           SET name = ?, phone = ?, location = ?, farmLocation = ?, email = COALESCE(?, email), notes = COALESCE(?, notes), updatedAt = NOW() 
           WHERE (name = ? OR name = ?) AND (shopId = ? OR ? IS NULL)`,
          [newName, newPhone, newLocation, newLocation, email || null, notes || null, currentName, newName, targetShopId, targetShopId]
        );
      } else {
        await pool.query(
          `INSERT INTO vendors (shopId, name, phone, location, farmLocation, email, notes, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
          [targetShopId || 1, newName, newPhone, newLocation, newLocation, email || '', notes || '']
        );
      }
    } catch (vErr) {
      console.error('[updateVendor] vendors table error:', vErr.message);
    }

    // 2. Update items table
    try {
      if (targetShopId) {
        await pool.query(
          `UPDATE items 
           SET supplierName = ?, supplierPhone = ?, supplierLocation = ?, farmLocation = ?, updatedAt = NOW() 
           WHERE (supplierName = ? OR supplierName = ?) AND shopId = ?`,
          [newName, newPhone, newLocation, newLocation, currentName, newName, targetShopId]
        );
      } else {
        await pool.query(
          `UPDATE items 
           SET supplierName = ?, supplierPhone = ?, supplierLocation = ?, farmLocation = ?, updatedAt = NOW() 
           WHERE supplierName = ? OR supplierName = ?`,
          [newName, newPhone, newLocation, newLocation, currentName, newName]
        );
      }
    } catch (iErr) {
      console.error('[updateVendor] items table error:', iErr.message);
    }

    // 3. Update purchases table
    try {
      if (targetShopId) {
        await pool.query(
          `UPDATE purchases 
           SET supplierName = ?, supplierPhone = ?, supplierLocation = ?, updatedAt = NOW() 
           WHERE (supplierName = ? OR supplierName = ?) AND shopId = ?`,
          [newName, newPhone, newLocation, currentName, newName, targetShopId]
        );
      } else {
        await pool.query(
          `UPDATE purchases 
           SET supplierName = ?, supplierPhone = ?, supplierLocation = ?, updatedAt = NOW() 
           WHERE supplierName = ? OR supplierName = ?`,
          [newName, newPhone, newLocation, currentName, newName]
        );
      }
    } catch (pErr) {
      console.error('[updateVendor] purchases table error:', pErr.message);
    }

    // 4. Update purchase_credits table
    try {
      if (targetShopId) {
        await pool.query(
          `UPDATE purchase_credits 
           SET supplierName = ?, supplierPhone = ?, supplierLocation = ?, updatedAt = NOW() 
           WHERE (supplierName = ? OR supplierName = ?) AND shopId = ?`,
          [newName, newPhone, newLocation, currentName, newName, targetShopId]
        );
      } else {
        await pool.query(
          `UPDATE purchase_credits 
           SET supplierName = ?, supplierPhone = ?, supplierLocation = ?, updatedAt = NOW() 
           WHERE supplierName = ? OR supplierName = ?`,
          [newName, newPhone, newLocation, currentName, newName]
        );
      }
    } catch (pcErr) {
      console.error('[updateVendor] purchase_credits table error:', pcErr.message);
    }

    res.json({
      success: true,
      message: `Vendor "${newName}" updated successfully!`,
      vendor: {
        name: newName,
        phone: newPhone,
        location: newLocation
      }
    });
  } catch (error) {
    console.error('[updateVendor error]', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Vendor and associated records across database
const deleteVendor = async (req, res) => {
  try {
    const { name, shopId } = req.body;
    const targetShopId = shopId || req.user?.shopId || null;

    if (!name) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }

    const vendorName = String(name).trim();

    // 1. Delete from vendors table
    try {
      if (targetShopId) {
        await pool.query('DELETE FROM vendors WHERE name = ? AND shopId = ?', [vendorName, targetShopId]);
      } else {
        await pool.query('DELETE FROM vendors WHERE name = ?', [vendorName]);
      }
    } catch (vErr) {
      console.error('[deleteVendor] vendors table error:', vErr.message);
    }

    // 2. Delete / Unassign from items table
    try {
      if (targetShopId) {
        await pool.query('DELETE FROM items WHERE supplierName = ? AND shopId = ?', [vendorName, targetShopId]);
      } else {
        await pool.query('DELETE FROM items WHERE supplierName = ?', [vendorName]);
      }
    } catch (iErr) {
      console.error('[deleteVendor] items table error:', iErr.message);
    }

    // 3. Delete from purchases table
    try {
      if (targetShopId) {
        await pool.query('DELETE FROM purchases WHERE supplierName = ? AND shopId = ?', [vendorName, targetShopId]);
      } else {
        await pool.query('DELETE FROM purchases WHERE supplierName = ?', [vendorName]);
      }
    } catch (pErr) {
      console.error('[deleteVendor] purchases table error:', pErr.message);
    }

    // 4. Delete from purchase_credits table
    try {
      if (targetShopId) {
        await pool.query('DELETE FROM purchase_credits WHERE supplierName = ? AND shopId = ?', [vendorName, targetShopId]);
      } else {
        await pool.query('DELETE FROM purchase_credits WHERE supplierName = ?', [vendorName]);
      }
    } catch (pcErr) {
      console.error('[deleteVendor] purchase_credits table error:', pcErr.message);
    }

    res.json({
      success: true,
      message: `Vendor "${vendorName}" and associated purchase records deleted successfully!`,
      deletedVendor: vendorName
    });
  } catch (error) {
    console.error('[deleteVendor error]', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all purchase credits
const getPurchaseCredits = async (req, res) => {
  try {
    const shopId = req.query.shopId || req.user?.shopId;
    let query = {};
    if (shopId) query.shopId = shopId;
    const credits = await PurchaseCredit.find(query);
    res.json(credits);
  } catch (error) {
    console.error('[getPurchaseCredits error]', error);
    res.status(500).json({ message: error.message });
  }
};

export {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  settleSupplierCredit,
  updateVendor,
  deleteVendor,
  deletePurchaseCredit,
  getPurchaseCredits
};
