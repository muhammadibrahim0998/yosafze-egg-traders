import express from 'express';
import Item from '../models/Item.js';
import Settings from '../models/Settings.js';
import Shop from '../models/Shop.js';
import { resolveShopId } from '../utils/shopResolver.js';

const router = express.Router();

const DEFAULT_EGG_PRODUCTS = [
  { name: 'loman brown',       category: 'loman brown',       price: 25, stock: 500, costPrice: 20 },
  { name: 'china egge',        category: 'china egge',        price: 20, stock: 600, costPrice: 15 },
  { name: 'loman brown egge',  category: 'loman brown egge',  price: 26, stock: 500, costPrice: 21 },
  { name: 'loman black',       category: 'loman black',       price: 28, stock: 400, costPrice: 22 },
  { name: 'china eggs',        category: 'china eggs',        price: 20, stock: 600, costPrice: 15 },
  { name: 'pak egg',           category: 'pak egg',           price: 22, stock: 600, costPrice: 17 },
  { name: 'Super Jumbo',       category: 'Super Jumbo',       price: 30, stock: 500, costPrice: 24 },
  { name: 'Jumbo',             category: 'Jumbo',             price: 28, stock: 500, costPrice: 22 },
  { name: 'Stander',           category: 'Stander',           price: 25, stock: 500, costPrice: 20 },
  { name: 'Weak Shell',        category: 'Weak Shell',        price: 18, stock: 300, costPrice: 14 },
  { name: 'Dusty',             category: 'Dusty',             price: 16, stock: 300, costPrice: 12 },
  { name: 'Floor',             category: 'Floor',             price: 15, stock: 200, costPrice: 11 },
  { name: 'Step Stander',      category: 'Step Stander',      price: 22, stock: 400, costPrice: 17 },
  { name: 'Step Jumbo',        category: 'Step Jumbo',        price: 24, stock: 400, costPrice: 19 },
  { name: 'Sandy',             category: 'Sandy',             price: 15, stock: 200, costPrice: 11 },
  { name: 'Starter',           category: 'Starter',           price: 20, stock: 400, costPrice: 15 },
  { name: 'Double White',      category: 'Double White',      price: 32, stock: 200, costPrice: 25 },
  { name: 'Double Brown',      category: 'Double Brown',      price: 35, stock: 200, costPrice: 28 },
  { name: 'Golden',            category: 'Golden',            price: 40, stock: 150, costPrice: 32 },
  { name: 'Breeder',           category: 'Breeder',           price: 45, stock: 150, costPrice: 36 },
  { name: 'Special',           category: 'Special',           price: 50, stock: 150, costPrice: 40 }
];

// GET /api/catalog/:shopId  — public, no auth needed
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { search, category } = req.query;

    const resolvedId = await resolveShopId(shopId);
    const shop = await Shop.findById(resolvedId).select('name address contactNumber status logoUrl');
    if (!shop || shop.status !== 'active') {
      return res.status(404).json({ message: 'Shop not found or inactive' });
    }

    const realShopId = shop._id;
    const settings = await Settings.findOne({ shopId: realShopId }).select('shopName logoUrl currency address phone');

    // Auto-seed missing default egg categories/products for any shop branch
    const existingItems = await Item.find({ shopId: realShopId }).select('name');
    const existingNames = new Set(existingItems.map(i => i.name));
    for (const prod of DEFAULT_EGG_PRODUCTS) {
      if (!existingNames.has(prod.name)) {
        await Item.create({
          shopId: realShopId,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          costPrice: prod.costPrice,
          stock: prod.stock,
          minStock: 10,
          description: `Fresh egg category: ${prod.name}`,
          images: ['/egg2.png']
        });
      }
    }

    const filter = { shopId: realShopId };
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
    const allItems = await Item.find({ shopId: realShopId }).select('category');
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
