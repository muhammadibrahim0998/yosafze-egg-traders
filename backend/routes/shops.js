import express from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/auth.js';
import { validateShop } from '../validators/shopValidator.js';
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Item, { getBranchItemModel } from '../models/Item.js';
import pool from '../config/mysql.js';

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

// Synchronize all bank accounts directly into MySQL columns & shop_banks table
const syncShopBanksToDatabase = async (shopId, banksList) => {
  try {
    if (!shopId) return;
    const list = Array.isArray(banksList) ? banksList.filter(b => b && (b.bankName || b.bankAccountNumber || b.bankAccountTitle)) : [];

    // 1. Sync shop_banks table
    await pool.query('DELETE FROM shop_banks WHERE shopId = ?', [shopId]);
    for (const b of list) {
      await pool.query(
        'INSERT INTO shop_banks (shopId, bankName, bankAccountNumber, bankAccountTitle) VALUES (?, ?, ?, ?)',
        [shopId, b.bankName || '', b.bankAccountNumber || '', b.bankAccountTitle || '']
      );
    }

    // 2. Prepare multi-bank combined strings and indexed columns
    const combinedNames = list.map(b => b.bankName).filter(Boolean).join(' | ');
    const combinedAccounts = list.map(b => b.bankAccountNumber).filter(Boolean).join(' | ');
    const combinedTitles = list.map(b => b.bankAccountTitle).filter(Boolean).join(' | ');

    const b1 = list[0] || {};
    const b2 = list[1] || {};
    const b3 = list[2] || {};
    const jsonStr = JSON.stringify(list);

    // Update shops table columns
    await pool.query(`
      UPDATE shops SET 
        bankName = ?,
        bankAccountNumber = ?,
        bankAccountTitle = ?,
        bankName2 = ?,
        bankAccountNumber2 = ?,
        bankAccountTitle2 = ?,
        bankName3 = ?,
        bankAccountNumber3 = ?,
        bankAccountTitle3 = ?,
        banksJson = ?
      WHERE id = ?
    `, [
      combinedNames || b1.bankName || '',
      combinedAccounts || b1.bankAccountNumber || '',
      combinedTitles || b1.bankAccountTitle || '',
      b2.bankName || null,
      b2.bankAccountNumber || null,
      b2.bankAccountTitle || null,
      b3.bankName || null,
      b3.bankAccountNumber || null,
      b3.bankAccountTitle || null,
      jsonStr,
      shopId
    ]);

    // Update settings table columns
    await pool.query(`
      UPDATE settings SET 
        bankName = ?,
        bankAccountNumber = ?,
        bankAccountTitle = ?,
        bankName2 = ?,
        bankAccountNumber2 = ?,
        bankAccountTitle2 = ?,
        bankName3 = ?,
        bankAccountNumber3 = ?,
        bankAccountTitle3 = ?,
        banksJson = ?
      WHERE shopId = ?
    `, [
      combinedNames || b1.bankName || '',
      combinedAccounts || b1.bankAccountNumber || '',
      combinedTitles || b1.bankAccountTitle || '',
      b2.bankName || null,
      b2.bankAccountNumber || null,
      b2.bankAccountTitle || null,
      b3.bankName || null,
      b3.bankAccountNumber || null,
      b3.bankAccountTitle || null,
      jsonStr,
      shopId
    ]);
  } catch (err) {
    console.error('Error syncing shop_banks to database:', err);
  }
};


// Helper to extract and normalize banks array
const normalizeBanks = (rawBanks, fallback = {}) => {
  let list = [];
  if (Array.isArray(rawBanks)) {
    list = rawBanks.filter(b => b && typeof b === 'object' && (b.bankName || b.bankAccountNumber || b.bankAccountTitle));
  } else if (typeof rawBanks === 'string') {
    try {
      const parsed = JSON.parse(rawBanks);
      if (Array.isArray(parsed)) {
        list = parsed.filter(b => b && typeof b === 'object' && (b.bankName || b.bankAccountNumber || b.bankAccountTitle));
      }
    } catch (_) {}
  }
  if (list.length === 0 && (fallback.bankName || fallback.bankAccountNumber)) {
    list = [{
      bankName: fallback.bankName || '',
      bankAccountNumber: fallback.bankAccountNumber || '',
      bankAccountTitle: fallback.bankAccountTitle || ''
    }];
  }
  return list;
};

// Get all active shops (Public / Storefront)
router.get('/public', async (req, res) => {
  try {
    const shops = await Shop.find({ status: 'active' }).sort({ createdAt: 1 });
    const enriched = await Promise.all(shops.map(async (s) => {
      const raw = typeof s.toObject === 'function' ? s.toObject() : { ...s };
      try {
        const st = await Settings.findOne({ shopId: s._id || s.id });
        if (st) {
          raw.bankName = raw.bankName || st.bankName || '';
          raw.bankAccountNumber = raw.bankAccountNumber || st.bankAccountNumber || '';
          raw.bankAccountTitle = raw.bankAccountTitle || st.bankAccountTitle || '';
          raw.easypaisaNumber = raw.easypaisaNumber || st.easypaisaNumber || '';
          if ((!raw.banksJson || raw.banksJson.length === 0) && st.banksJson) {
            raw.banksJson = st.banksJson;
          }
        }
      } catch (e) {}
      raw.banks = normalizeBanks(raw.banksJson || raw.banks, raw);
      raw.banksJson = raw.banks;
      if (raw.banks.length > 0) {
        raw.bankName = raw.banks[0].bankName || raw.bankName || '';
        raw.bankAccountNumber = raw.banks[0].bankAccountNumber || raw.bankAccountNumber || '';
        raw.bankAccountTitle = raw.banks[0].bankAccountTitle || raw.bankAccountTitle || '';
      }
      return raw;
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all shops (Super Admin only)
router.get('/', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });
    const enrichedShops = await Promise.all(shops.map(async (s) => {
      const raw = typeof s.toObject === 'function' ? s.toObject() : { ...s };
      try {
        const st = await Settings.findOne({ shopId: s._id || s.id });
        if (st) {
          raw.bankName = raw.bankName || st.bankName || '';
          raw.bankAccountNumber = raw.bankAccountNumber || st.bankAccountNumber || '';
          raw.bankAccountTitle = raw.bankAccountTitle || st.bankAccountTitle || '';
          raw.easypaisaNumber = raw.easypaisaNumber || st.easypaisaNumber || '';
          if ((!raw.banksJson || raw.banksJson.length === 0) && st.banksJson) {
            raw.banksJson = st.banksJson;
          }
        }
      } catch (e) {}
      raw.banks = normalizeBanks(raw.banksJson || raw.banks, raw);
      raw.banksJson = raw.banks;
      if (raw.banks.length > 0) {
        raw.bankName = raw.banks[0].bankName || raw.bankName || '';
        raw.bankAccountNumber = raw.banks[0].bankAccountNumber || raw.bankAccountNumber || '';
        raw.bankAccountTitle = raw.banks[0].bankAccountTitle || raw.bankAccountTitle || '';
      }
      return raw;
    }));
    res.json(enrichedShops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create shop (Super Admin only)
router.post('/', authenticate, requireSuperAdmin, validateShop, async (req, res) => {
  try {
    const { 
      name, address, contactNumber, adminUsername, adminPassword, adminFullName, adminEmail, adminPhone, 
      logoUrl, easypaisaNumber, bankName, bankAccountNumber, bankAccountTitle, banks 
    } = req.body;
    
    // Check if username is taken
    if (adminUsername) {
      const existingUser = await User.findOne({ username: adminUsername });
      if (existingUser) {
        return res.status(400).json({ message: "Admin username is already taken" });
      }
    }

    const banksList = normalizeBanks(banks, { bankName, bankAccountNumber, bankAccountTitle });
    const primaryBank = banksList[0] || {};

    const shop = await Shop.create({ 
      name, 
      address, 
      contactNumber, 
      logoUrl,
      easypaisaNumber: easypaisaNumber || '',
      bankName: primaryBank.bankName || bankName || '',
      bankAccountNumber: primaryBank.bankAccountNumber || bankAccountNumber || '',
      bankAccountTitle: primaryBank.bankAccountTitle || bankAccountTitle || '',
      banks: banksList,
      banksJson: banksList,
      ownerDetails: {
        fullName: adminFullName || 'Shop Admin',
        email: adminEmail || adminUsername || '',
        phone: adminPhone || ''
      }
    });

    // Create initial settings for the shop
    const settings = await Settings.create({
      shopId: shop._id || shop.id,
      shopName: name,
      address: address || '',
      phone: contactNumber || '',
      easypaisaNumber: easypaisaNumber || '',
      easypaisaEnabled: easypaisaNumber ? true : false,
      bankName: primaryBank.bankName || bankName || '',
      bankAccountNumber: primaryBank.bankAccountNumber || bankAccountNumber || '',
      bankAccountTitle: primaryBank.bankAccountTitle || bankAccountTitle || '',
      banksJson: banksList,
    });

    let adminUser = null;
    if (adminUsername && adminPassword) {
      adminUser = await User.create({
        username: adminUsername,
        password: adminPassword,
        email: adminEmail || adminUsername || undefined,
        fullName: adminFullName || 'Shop Admin',
        role: 'shop_admin',
        shopId: shop._id || shop.id
      });
    }

    await syncShopBanksToDatabase(shop._id || shop.id, banksList);

    res.status(201).json({ shop, adminUser, settings });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Update shop details
router.put('/:id', authenticate, validateShop, async (req, res) => {
  try {
    const { 
      name, address, contactNumber, status, ownerEmail, easypaisaNumber, 
      bankName, bankAccountNumber, bankAccountTitle, banks 
    } = req.body;
    
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
    if (easypaisaNumber !== undefined) shop.easypaisaNumber = easypaisaNumber;

    if (banks !== undefined) {
      const banksList = normalizeBanks(banks, { bankName, bankAccountNumber, bankAccountTitle });
      shop.banksJson = banksList;
      shop.banks = banksList;
      if (banksList.length > 0) {
        shop.bankName = banksList[0].bankName || '';
        shop.bankAccountNumber = banksList[0].bankAccountNumber || '';
        shop.bankAccountTitle = banksList[0].bankAccountTitle || '';
      } else {
        shop.bankName = '';
        shop.bankAccountNumber = '';
        shop.bankAccountTitle = '';
      }
    } else {
      if (bankName !== undefined) shop.bankName = bankName;
      if (bankAccountNumber !== undefined) shop.bankAccountNumber = bankAccountNumber;
      if (bankAccountTitle !== undefined) shop.bankAccountTitle = bankAccountTitle;
    }
    
    if (isSuperAdmin) {
      if (status) shop.status = status;
      if (req.body.isEditApproved !== undefined) shop.isEditApproved = req.body.isEditApproved ? 1 : 0;
      if (req.body.isDeleteApproved !== undefined) shop.isDeleteApproved = req.body.isDeleteApproved ? 1 : 0;
      if (req.body.approvalStatus !== undefined) shop.approvalStatus = req.body.approvalStatus;
      if (req.body.approvalNotes !== undefined) shop.approvalNotes = req.body.approvalNotes;
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

    // Sync to settings as well
    try {
      let shopSettings = await Settings.findOne({ shopId: shop._id || shop.id });
      if (!shopSettings) {
        shopSettings = new Settings({ shopId: shop._id || shop.id });
      }
      if (name) shopSettings.shopName = name;
      if (address !== undefined) shopSettings.address = address;
      if (contactNumber !== undefined) shopSettings.phone = contactNumber;
      if (easypaisaNumber !== undefined) {
        shopSettings.easypaisaNumber = easypaisaNumber;
        shopSettings.easypaisaEnabled = !!easypaisaNumber;
      }
      if (shop.banksJson !== undefined) {
        shopSettings.banksJson = shop.banksJson;
      }
      if (shop.bankName !== undefined) shopSettings.bankName = shop.bankName;
      if (shop.bankAccountNumber !== undefined) shopSettings.bankAccountNumber = shop.bankAccountNumber;
      if (shop.bankAccountTitle !== undefined) shopSettings.bankAccountTitle = shop.bankAccountTitle;
      await shopSettings.save();
    } catch (sErr) {
      console.warn('Sync settings on shop update error:', sErr);
    }

    if (banks !== undefined) {
      const banksList = normalizeBanks(banks, { bankName, bankAccountNumber, bankAccountTitle });
      await syncShopBanksToDatabase(req.params.id, banksList);
    }

    res.json(shop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update shop branch approval settings (Super Admin only)
router.patch('/:id/approval', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { isEditApproved, isDeleteApproved, approvalStatus, approvalNotes, allowedPages } = req.body;
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });

    if (isEditApproved !== undefined) shop.isEditApproved = isEditApproved ? 1 : 0;
    if (isDeleteApproved !== undefined) shop.isDeleteApproved = isDeleteApproved ? 1 : 0;
    if (approvalStatus !== undefined) shop.approvalStatus = approvalStatus;
    if (approvalNotes !== undefined) shop.approvalNotes = approvalNotes;
    if (allowedPages !== undefined) shop.allowedPages = Array.isArray(allowedPages) ? allowedPages : [];

    await shop.save();
    res.json({ success: true, message: 'Branch approval status updated successfully', shop });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete shop (Super Admin only)
router.delete('/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    // Also remove associated users
    await User.deleteMany({ shopId: req.params.id });
    await Item.deleteMany({ shopId: req.params.id });
    try {
      const BranchModel = getBranchItemModel(req.params.id);
      await BranchModel.deleteMany({});
    } catch (bErr) {}
    res.json({ message: 'Shop and associated users deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
