import express from 'express';
import Item from '../models/Item.js';
import Settings from '../models/Settings.js';
import Shop from '../models/Shop.js';

const router = express.Router();

// GET /api/catalog/:shopId  — public, no auth needed
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { search, category } = req.query;

    const shop = await Shop.findById(shopId).select('name address contactNumber status logoUrl');
    if (!shop || shop.status !== 'active') {
      return res.status(404).json({ message: 'Shop not found or inactive' });
    }

    const settings = await Settings.findOne({ shopId }).select('shopName logoUrl currency address phone');

    const filter = { shopId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All') {
      filter.category = category;
    }

    const items = await Item.find(filter)
      .select('name category price images description stock minStock costPrice expiryDate')
      .sort({ name: 1 });

    // Get unique categories
    const allItems = await Item.find({ shopId }).select('category');
    const categories = ['All', ...new Set(allItems.map(i => i.category))];

    res.json({
      shop: {
        name: settings?.shopName || shop.name,
        address: settings?.address || shop.address,
        phone: settings?.phone || shop.contactNumber,
        logoUrl: settings?.logoUrl || shop.logoUrl,
        currency: (!settings?.currency || settings.currency === '$') ? 'Rs.' : settings.currency
      },
      items,
      categories
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/catalog  — list all active shops (for multi-shop entry)
router.get('/', async (req, res) => {
  try {
    const shops = await Shop.find({ status: 'active' }).select('name address contactNumber logoUrl');
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
