import mongoose from 'mongoose';
import Item from '../models/Item.js';
import Expense from '../models/Expense.js';
import { logSystemUpdate } from '../utils/updateHelper.js';

// @desc    Get all items
const getItems = async (req, res) => {
  try {
    const queryShopId = req.query.shopId;
    let filter = {};
    if (req.user?.role === 'super_admin') {
      if (queryShopId) filter.shopId = queryShopId;
    } else if (req.user?.shopId) {
      filter.shopId = req.user.shopId;
    } else if (queryShopId) {
      filter.shopId = queryShopId;
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });
    const normalized = items.map(item => {
      const itemObj = typeof item.toObject === 'function' ? item.toObject() : item;
      const pMethod = String(itemObj.paymentMethod || '').trim().toLowerCase();
      const isOnline = itemObj.isOnlinePayment === true || Boolean(itemObj.paymentReceipt) || (
        pMethod.includes('bank') || pMethod.includes('easy') || pMethod.includes('jazz') || pMethod.includes('online') || pMethod.includes('cheque') || pMethod.includes('transfer') || pMethod.includes('card')
      );
      itemObj.isOnlinePayment = isOnline;

      const petiQty = Number(itemObj.petiQuantity) || 0;
      const stock = Number(itemObj.stock) || 0;
      const unitCost = Number(itemObj.costPrice) > 0 ? Number(itemObj.costPrice) : Number(itemObj.price || 0);
      const unitDivisor = itemObj.unitType === 'egg' ? 1 : itemObj.unitType === 'tray' ? 30 : 360;

      const calculatedCost = Number(itemObj.totalPurchaseCost) > 0
        ? Number(itemObj.totalPurchaseCost)
        : (petiQty > 0 ? petiQty * unitCost : (stock > 0 ? stock * (unitCost / unitDivisor) : 0));
      
      itemObj.totalPurchaseCost = Math.round(calculatedCost);

      const isCreditMethod = pMethod.includes('credit') || pMethod.includes('due') || pMethod.includes('qaraz') || pMethod.includes('partial');
      const hasExplicitDue = itemObj.dueAmountToSupplier !== undefined && itemObj.dueAmountToSupplier !== null && Number(itemObj.dueAmountToSupplier) > 0;

      if (hasExplicitDue || isCreditMethod) {
        const rawDue = hasExplicitDue ? Number(itemObj.dueAmountToSupplier) : itemObj.totalPurchaseCost;
        itemObj.dueAmountToSupplier = Math.min(itemObj.totalPurchaseCost, Math.max(0, rawDue));
        itemObj.amountPaidToSupplier = Math.max(0, itemObj.totalPurchaseCost - itemObj.dueAmountToSupplier);
      } else {
        // 100% Cash / Bank Paid (No Qaraz)
        itemObj.amountPaidToSupplier = itemObj.totalPurchaseCost;
        itemObj.dueAmountToSupplier = 0;
      }

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
    if (!id || id === 'undefined' || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const filter = (req.user?.role === 'super_admin' || !req.user?.shopId)
      ? { _id: id }
      : { _id: id, shopId: req.user.shopId };

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
    // Use shopId from body (if specified, e.g. SuperAdmin), fallback to user's shopId
    const shopId = req.body.shopId || req.user?.shopId;
    if (!shopId) {
      return res.status(400).json({ message: 'shopId is required to add a product' });
    }
    const finalImages = (req.body.images && req.body.images.length > 0) ? req.body.images : ['/egg2.png'];
    const pMethod = String(req.body.paymentMethod || '').trim().toLowerCase();
    const isOnline = req.body.isOnlinePayment === true || Boolean(req.body.paymentReceipt) || (
      pMethod.includes('bank') || pMethod.includes('easy') || pMethod.includes('jazz') || pMethod.includes('online') || pMethod.includes('cheque') || pMethod.includes('transfer') || pMethod.includes('card')
    );

    const totalCost = Number(req.body.totalPurchaseCost || 0);
    const paidAmt = Number(req.body.amountPaidToSupplier || 0);
    const dueAmt = req.body.dueAmountToSupplier !== undefined 
      ? Number(req.body.dueAmountToSupplier)
      : Math.max(0, totalCost - paidAmt);

    const newItemData = { 
      ...req.body, 
      images: finalImages, 
      shopId,
      isOnlinePayment: isOnline,
      totalPurchaseCost: totalCost,
      amountPaidToSupplier: paidAmt,
      dueAmountToSupplier: dueAmt
    };
    const newItem = await Item.create(newItemData);
    
    // Auto-create expense record if payment was made to supplier
    if (newItem.amountPaidToSupplier && newItem.amountPaidToSupplier > 0) {
      try {
        await Expense.create({
          shopId: newItem.shopId.toString(),
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

    // Check if this is a new category for the shop (optional but requested)
    const categoryCount = await Item.countDocuments({ 
      shopId, 
      category: newItem.category 
    });
    
    if (categoryCount === 1) {
      await logSystemUpdate(
        "UI Improvements", 
        "sparkles", 
        `New Category established: ${newItem.category}`
      );
    }

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
    if (!id || id === 'undefined' || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const updateData = { ...req.body };
    if (req.body.paymentMethod !== undefined || req.body.paymentReceipt !== undefined) {
      const pMethod = String(req.body.paymentMethod || '').trim().toLowerCase();
      updateData.isOnlinePayment = req.body.isOnlinePayment === true || Boolean(req.body.paymentReceipt) || (
        pMethod.includes('bank') || pMethod.includes('easy') || pMethod.includes('jazz') || pMethod.includes('online') || pMethod.includes('cheque') || pMethod.includes('transfer') || pMethod.includes('card')
      );
    }

    // Branch scoping: Shop admin can only update their own shop's item (super admin can update any)
    const filter = (req.user?.role === 'super_admin' || !req.user?.shopId)
      ? { _id: id }
      : { _id: id, shopId: req.user.shopId };

    const updatedItem = await Item.findOneAndUpdate(
      filter,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ message: 'Item not found or unauthorized' });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Branch scoping: Shop admin can only delete their own shop's item (super admin can delete any)
    const filter = (req.user?.role === 'super_admin' || !req.user?.shopId)
      ? { _id: id }
      : { _id: id, shopId: req.user.shopId };

    const item = await Item.findOneAndDelete(filter);
    if (!item) {
      return res.status(404).json({ message: 'Item not found or unauthorized' });
    }
    res.json({ message: 'Item deleted successfully', deletedId: id, existed: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
