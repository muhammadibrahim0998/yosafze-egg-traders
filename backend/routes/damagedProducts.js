import express from 'express';
import DamagedProduct from '../models/DamagedProduct.js';
import { resolveShopId } from '../utils/shopResolver.js';

const router = express.Router();

// GET all damaged product logs for a shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const realShopId = await resolveShopId(shopId);
    const records = await DamagedProduct.find({ shopId: realShopId }).sort({ damageDate: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST log a new damaged product entry
router.post('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const realShopId = await resolveShopId(shopId);
    const { productName, productId, quantity, unitPrice, totalLoss, reason, damageDate, notes, reportedBy } = req.body;

    if (!productName || !quantity) {
      return res.status(400).json({ success: false, message: 'Product name and damaged quantity are required' });
    }

    const qty = Number(quantity);
    const price = Number(unitPrice || 0);
    const loss = totalLoss !== undefined ? Number(totalLoss) : (qty * price);

    const newRecord = new DamagedProduct({
      shopId: realShopId,
      productName,
      productId: productId || '',
      quantity: qty,
      unitPrice: price,
      totalLoss: loss,
      reason: reason || 'Egg Breakage / Crack',
      damageDate: damageDate ? new Date(damageDate) : new Date(),
      notes: notes || '',
      reportedBy: reportedBy || 'Shop Admin'
    });

    await newRecord.save();
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE a damaged product log entry by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await DamagedProduct.findByIdAndDelete(id);
    res.json({ success: true, message: 'Damaged product entry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
