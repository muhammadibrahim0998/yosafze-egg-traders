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

    // Remove any palto erp@gmail.com user
    await User.deleteMany({
      $or: [
        { email: 'erp@gmail.com' },
        { username: 'erp@gmail.com' }
      ]
    });

    // 1. Setup / Update Shop Admin for Yosafze Egg Traders (admin@yosafze.com)
    let shopAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@yosafze.com' },
        { username: 'admin@yosafze.com' },
        { username: 'admin' }
      ] 
    });

    if (!shopAdmin) {
      shopAdmin = new User({
        username: 'admin@yosafze.com',
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

    // 2. Super Admin (Mainyet123@gmail.com)
    await User.deleteMany({
      role: 'super_admin',
      email: { $nin: ['Mainyet123@gmail.com', 'mainyet123@gmail.com'] },
      username: { $nin: ['Mainyet123@gmail.com', 'mainyet123@gmail.com'] }
    });

    let mainyetAdmin = await User.findOne({ 
      $or: [{ username: 'Mainyet123@gmail.com' }, { email: 'Mainyet123@gmail.com' }, { role: 'super_admin' }] 
    });
    if (!mainyetAdmin) {
      mainyetAdmin = new User({
        username: 'Mainyet123@gmail.com',
        email: 'Mainyet123@gmail.com',
        fullName: 'System Super Admin',
        role: 'super_admin',
        status: 'active'
      });
    }
    mainyetAdmin.username = 'Mainyet123@gmail.com';
    mainyetAdmin.email = 'Mainyet123@gmail.com';
    mainyetAdmin.password = 'super12345';
    mainyetAdmin.role = 'super_admin';
    mainyetAdmin.status = 'active';
    await mainyetAdmin.save();

    // Test verify logins
    const testAdmin = await User.findOne({ username: 'admin@yosafze.com' });
    const isMatch1 = await testAdmin.comparePassword('admin123');
    console.log('Password check for admin@yosafze.com (admin123):', isMatch1 ? '✅ MATCH' : '❌ FAILED');

    const testSuper = await User.findOne({ email: 'Mainyet123@gmail.com' });
    const isMatch2 = await testSuper.comparePassword('super12345');
    console.log('Password check for Mainyet123@gmail.com (super12345):', isMatch2 ? '✅ MATCH' : '❌ FAILED');

    console.log('\n--- AVAILABLE LOGINS ---');
    console.log('1. Shop Admin (Yosafze Egg Traders):');
    console.log('   Username/Email: admin@yosafze.com');
    console.log('   Password:       admin123');
    console.log('2. Super Admin:');
    console.log('   Username/Email: Mainyet123@gmail.com');
    console.log('   Password:       super12345');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting logins:', err);
    process.exit(1);
  }
};

resetLogins();
