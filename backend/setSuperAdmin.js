import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const setSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge');
    console.log('✅ Connected to egge database');

    // Remove old super admins if needed
    await User.deleteMany({
      $or: [
        { email: { $in: ['ibrahim1530388@gmail.com', 'superadmin@gmail.com'] } },
        { username: { $in: ['ibrahim1530388@gmail.com', 'superadmin@gmail.com'] } }
      ]
    });

    let superAdmin = await User.findOne({
      $or: [
        { role: 'super_admin' },
        { email: 'mainyet123@gmail.com' },
        { username: 'mainyet123@gmail.com' }
      ]
    });

    if (!superAdmin) {
      superAdmin = new User({
        username: 'Mainyet123@gmail.com',
        email: 'Mainyet123@gmail.com',
        fullName: 'Super Admin',
        role: 'super_admin',
        status: 'active'
      });
    }

    superAdmin.username = 'Mainyet123@gmail.com';
    superAdmin.email = 'Mainyet123@gmail.com';
    superAdmin.password = 'super12345';
    superAdmin.role = 'super_admin';
    superAdmin.status = 'active';
    await superAdmin.save();

    const check = await User.findOne({ email: 'Mainyet123@gmail.com' });
    const isMatch = await check.comparePassword('super12345');
    console.log('Password check for Mainyet123@gmail.com with super12345:', isMatch ? '✅ SUCCESS' : '❌ FAILED');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting SuperAdmin:', err);
    process.exit(1);
  }
};

setSuperAdmin();
