import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

// GET all expenses for a shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const expenses = await Expense.find({ shopId }).sort({ expenseDate: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST add a new expense for a shop
router.post('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { title, category, amount, expenseDate, notes, createdBy } = req.body;

    if (!title || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Title and amount are required' });
    }

    const newExpense = new Expense({
      shopId,
      title,
      category: category || 'Other',
      amount: Number(amount),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      notes: notes || '',
      createdBy: createdBy || 'Shop Admin'
    });

    await newExpense.save();
    res.status(201).json({ success: true, data: newExpense });
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
