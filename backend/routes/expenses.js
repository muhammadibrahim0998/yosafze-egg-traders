import express from 'express';
import Expense from '../models/Expense.js';
import { resolveShopId } from '../utils/shopResolver.js';

const router = express.Router();

// GET all expenses (optionally filtered by shopId)
router.get('/', async (req, res) => {
  try {
    const rawShopId = req.query.shopId || req.headers['x-shop-id'];
    let filter = {};
    if (rawShopId) {
      const realShopId = await resolveShopId(rawShopId);
      if (realShopId) filter.shopId = realShopId;
    }
    const expenses = await Expense.find(filter).sort({ expenseDate: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all expenses for a specific shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const realShopId = await resolveShopId(shopId);
    const expenses = await Expense.find({ shopId: realShopId }).sort({ expenseDate: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add a new expense
const handleCreateExpense = async (req, res) => {
  try {
    const rawShopId = req.params.shopId || req.body.shopId || req.query.shopId || 1;
    const realShopId = await resolveShopId(rawShopId);
    const { title, category, amount, paymentMethod, paymentSource, expenseDate, notes, createdBy } = req.body;

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }

    const source = (paymentSource || paymentMethod || 'CASH').toUpperCase().includes('BANK') ? 'BANK' : 'CASH';

    const expensePayload = {
      shopId: realShopId,
      title,
      category: category || 'Other',
      amount: Number(amount),
      paymentMethod: source,
      paymentSource: source,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      notes: notes || '',
      createdBy: createdBy || 'Shop Admin'
    };

    const newExpense = await Expense.create(expensePayload);
    res.status(201).json({ success: true, data: newExpense });
  } catch (error) {
    console.error('[Expense Create Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

router.post('/', handleCreateExpense);
router.post('/shop/:shopId', handleCreateExpense);

// PUT update an expense by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, amount, paymentMethod, paymentSource, expenseDate, notes, createdBy, shopId } = req.body;
    const updateData = {};
    if (shopId !== undefined) {
      const realShopId = await resolveShopId(shopId);
      if (realShopId) updateData.shopId = realShopId;
    }
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (paymentMethod !== undefined || paymentSource !== undefined) {
      const source = (paymentSource || paymentMethod || 'CASH').toUpperCase().includes('BANK') ? 'BANK' : 'CASH';
      updateData.paymentMethod = source;
      updateData.paymentSource = source;
    }
    if (expenseDate !== undefined) updateData.expenseDate = new Date(expenseDate);
    if (notes !== undefined) updateData.notes = notes;
    if (createdBy !== undefined) updateData.createdBy = createdBy;

    const updated = await Expense.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE an expense by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
