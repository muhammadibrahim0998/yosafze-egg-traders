import express from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { validateShop } from '../validators/shopValidator.js';
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Item from '../models/Item.js';

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

const router = express.Router();

// Get all shops (Super Admin only)
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create shop (Super Admin only)
router.post('/', authenticate, requireSuperAdmin, validateShop, async (req, res) => {
  try {
    const { name, address, contactNumber, adminUsername, adminPassword, adminFullName, adminEmail, adminPhone, logoUrl, easypaisaNumber } = req.body;
    
    // Check if username is taken
    if (adminUsername) {
      const existingUser = await User.findOne({ username: adminUsername });
      if (existingUser) {
        return res.status(400).json({ message: "Admin username is already taken" });
      }
    }

    const shop = new Shop({ 
      name, 
      address, 
      contactNumber, 
      logoUrl,
      ownerDetails: {
        fullName: adminFullName || 'Shop Admin',
        email: adminEmail || adminUsername || '',
        phone: adminPhone || ''
      }
    });
    await shop.save();

    // Create initial settings for the shop
    const settings = new Settings({
      shopId: shop._id,
      shopName: name,
      address: address || '',
      phone: contactNumber || '',
      easypaisaNumber: easypaisaNumber || '',
      easypaisaEnabled: easypaisaNumber ? true : false,
    });
    await settings.save();

    let adminUser = null;
    if (adminUsername && adminPassword) {
      adminUser = new User({
        username: adminUsername,
        password: adminPassword,
        email: adminEmail || adminUsername || undefined,
        fullName: adminFullName || 'Shop Admin',
        role: 'shop_admin',
        shopId: shop._id
      });
      await adminUser.save();
    }

    // Auto-seed all 20 default egg categories for the newly registered shop
    for (const prod of DEFAULT_EGG_PRODUCTS) {
      await Item.create({
        shopId: shop._id,
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

    res.status(201).json({ shop, adminUser, settings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update shop details
router.put('/:id', authenticate, validateShop, async (req, res) => {
  try {
    const { name, address, contactNumber, status, ownerEmail } = req.body;
    
    // Authorization Check: Super Admin OR the Shop's Admin
    const isSuperAdmin = req.user.role === 'super_admin';
    const isOwnShop = req.user.shopId && req.user.shopId.toString() === req.params.id;

    if (!isSuperAdmin && !isOwnShop) {
      return res.status(403).json({ message: "Not authorized to update this shop" });
    }

    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    // Only Super Admin can change shop status
    shop.name = name;
    shop.address = address;
    shop.contactNumber = contactNumber;
    
    if (isSuperAdmin && status) {
      shop.status = status;
    }
    
    if (ownerEmail !== undefined) {
      if (!shop.ownerDetails) shop.ownerDetails = {};
      shop.ownerDetails.email = ownerEmail;
      
      // Update the user's email too if we have a match
      if (shop.ownerDetails.fullName) {
         // Assuming the first shop_admin is the owner
         await User.findOneAndUpdate(
           { shopId: shop._id, role: 'shop_admin' },
           { email: ownerEmail }
         );
      }
    }

    await shop.save();
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json(shop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete shop (Super Admin only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    // Also remove associated users
    await User.deleteMany({ shopId: req.params.id });
    res.json({ message: 'Shop and associated users deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
