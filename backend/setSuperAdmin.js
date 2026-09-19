import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const setSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge');
    console.log('✅ Connected to egge database');

    let superAdmin = await User.findOne({
      $or: [
        { role: 'super_admin' },
        { email: 'superadmin@gmail.com' },
        { username: 'superadmin@gmail.com' }
      ]
    });

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
    superAdmin.password = 'super12345';
    superAdmin.role = 'super_admin';
    superAdmin.status = 'active';
    await superAdmin.save();

    const check = await User.findOne({ email: 'superadmin@gmail.com' });
    const isMatch = await check.comparePassword('super12345');
    console.log('Password match test for superadmin@gmail.com with super12345:', isMatch ? '✅ SUCCESS' : '❌ FAILED');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting SuperAdmin:', err);
    process.exit(1);
  }
};

setSuperAdmin();
