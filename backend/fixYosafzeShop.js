import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from './models/Shop.js';
import Settings from './models/Settings.js';
import User from './models/User.js';

dotenv.config();

const fixShop = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge');
    console.log('✅ Connected to MongoDB');

    // 1. Update all shops to Yosafze Egg Traders Mardan
    const shops = await Shop.find({});
    for (const shop of shops) {
      shop.name = 'Yosafze Egg Traders Mardan';
      shop.address = 'Charsadda Chowk, Mardan, KPK, Pakistan';
      shop.contactNumber = '+92 313 9633280';
      shop.ownerDetails = {
        fullName: 'Yosafze Egg Traders',
        email: 'yosafzeeggtraders@gmail.com',
        phone: '+92 313 9633280'
      };
      await shop.save();
      console.log(`✅ Updated Shop [${shop._id}] to: Yosafze Egg Traders Mardan`);
    }

    // 2. Update Settings
    const settingsList = await Settings.find({});
    for (const s of settingsList) {
      s.shopName = 'Yosafze Egg Traders Mardan';
      s.address = 'Charsadda Chowk, Mardan, KPK, Pakistan';
      s.phone = '+92 313 9633280';
      s.currency = 'Rs.';
      await s.save();
      console.log(`✅ Updated Settings [${s._id}] to: Yosafze Egg Traders Mardan`);
    }

    // 3. Update any ERP user to Yosafze
    const erpUsers = await User.find({ email: 'erp@gmail.com' });
    for (const u of erpUsers) {
      u.fullName = 'Yosafze Egg Traders Mardan Admin';
      await u.save();
      console.log(`✅ Updated user ${u.email}`);
    }

    console.log('🎉 Database update complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating shop:', err);
    process.exit(1);
  }
};

fixShop();
