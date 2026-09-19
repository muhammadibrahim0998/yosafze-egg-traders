import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Shop from './models/Shop.js';

dotenv.config();

const resetLogins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge');
    console.log('✅ Connected to egge database');

    const mainShop = await Shop.findOne({ status: 'active' });
    const shopId = mainShop ? mainShop._id : null;
    console.log('Main Shop ID:', shopId);

    // 1. Setup / Update Shop Admin for Yosafze Egg Traders
    let shopAdmin = await User.findOne({ 
      $or: [
        { email: 'erp@gmail.com' }, 
        { username: 'erp@gmail.com' },
        { email: 'admin@yosafze.com' },
        { username: 'admin@yosafze.com' },
        { username: 'admin' }
      ] 
    });

    if (!shopAdmin) {
      shopAdmin = new User({
        username: 'admin',
        email: 'admin@yosafze.com',
        fullName: 'Yosafze Egg Traders Admin',
        role: 'shop_admin',
        shopId: shopId,
        status: 'active'
      });
    }

    shopAdmin.username = 'admin@yosafze.com';
    shopAdmin.email = 'admin@yosafze.com';
    shopAdmin.fullName = 'Yosafze Egg Traders Admin';
    shopAdmin.role = 'shop_admin';
    shopAdmin.shopId = shopId;
    shopAdmin.status = 'active';
    shopAdmin.password = 'admin123'; // Will be hashed by pre-save hook
    await shopAdmin.save();

    // 2. Also ensure erp@gmail.com exists with password 'admin123' if they try typing it
    let erpUser = await User.findOne({ username: 'erp@gmail.com' });
    if (!erpUser) {
      erpUser = new User({
        username: 'erp@gmail.com',
        email: 'erp@gmail.com',
        fullName: 'Yosafze Egg Traders Admin',
        role: 'shop_admin',
        shopId: shopId,
        status: 'active'
      });
    }
    erpUser.password = 'admin123';
    erpUser.shopId = shopId;
    erpUser.status = 'active';
    await erpUser.save();

    // 3. Super Admin
    let superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      superAdmin = new User({
        username: 'superadmin@gmail.com',
        email: 'superadmin@gmail.com',
        fullName: 'Super Admin',
        role: 'super_admin',
        status: 'active'
      });
    }
    superAdmin.username = 'superadmin@gmail.com';
    superAdmin.email = 'superadmin@gmail.com';
    superAdmin.password = 'admin123';
    superAdmin.status = 'active';
    await superAdmin.save();

    // Test verify logins
    const testAdmin = await User.findOne({ username: 'admin@yosafze.com' });
    const isMatch1 = await testAdmin.comparePassword('admin123');
    console.log('Password check for admin@yosafze.com (admin123):', isMatch1 ? '✅ MATCH' : '❌ FAILED');

    const testSuper = await User.findOne({ username: 'superadmin@gmail.com' });
    const isMatch2 = await testSuper.comparePassword('admin123');
    console.log('Password check for superadmin@gmail.com (admin123):', isMatch2 ? '✅ MATCH' : '❌ FAILED');

    console.log('\n--- AVAILABLE LOGINS ---');
    console.log('1. Shop Admin (Yosafze Egg Traders):');
    console.log('   Username/Email: admin@yosafze.com (or erp@gmail.com)');
    console.log('   Password:       admin123');
    console.log('2. Super Admin:');
    console.log('   Username/Email: superadmin@gmail.com');
    console.log('   Password:       admin123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting logins:', err);
    process.exit(1);
  }
};

resetLogins();
