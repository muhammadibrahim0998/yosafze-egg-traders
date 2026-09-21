import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge');

    // Remove all other super admin accounts except Mainyet123@gmail.com
    await User.deleteMany({
      role: 'super_admin',
      email: { $nin: ['Mainyet123@gmail.com', 'mainyet123@gmail.com'] },
      username: { $nin: ['Mainyet123@gmail.com', 'mainyet123@gmail.com'] }
    });

    // Only create or update the single Super Admin: Mainyet123@gmail.com
    let superAdmin = await User.findOne({ 
      $or: [
        { email: 'Mainyet123@gmail.com' },
        { username: 'Mainyet123@gmail.com' },
        { email: 'mainyet123@gmail.com' },
        { username: 'mainyet123@gmail.com' },
        { role: 'super_admin' }
      ]
    });

    if (!superAdmin) {
      superAdmin = new User({
        username: 'Mainyet123@gmail.com',
        email: 'Mainyet123@gmail.com',
        password: 'super12345',
        fullName: 'System Super Admin',
        role: 'super_admin',
        status: 'active'
      });
      await superAdmin.save();
      console.log('✅ Super Admin created. Email: Mainyet123@gmail.com');
    } else {
      superAdmin.username = 'Mainyet123@gmail.com';
      superAdmin.email = 'Mainyet123@gmail.com';
      superAdmin.password = 'super12345';
      superAdmin.role = 'super_admin';
      superAdmin.status = 'active';
      await superAdmin.save();
      console.log('✅ Super Admin updated. Email: Mainyet123@gmail.com');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedDB();
