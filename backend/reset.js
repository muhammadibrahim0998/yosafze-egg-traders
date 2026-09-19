import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge');
  const db = mongoose.connection.db;
  const users = db.collection('users');
  
  const hash = await bcrypt.hash('123456', 10);
  
  await users.updateOne({ username: 'peshawer@gmail.com' }, { $set: { password: hash } });
  
  console.log('Password updated to 123456');
  process.exit(0);
};
run();
