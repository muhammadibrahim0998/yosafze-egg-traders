import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from './models/Shop.js';
import Item from './models/Item.js';

dotenv.config();

const defaultEggProducts = [
  { name: 'Super Jumbo 79gm', category: 'Eggs', price: 25, stock: 500, minStock: 50, images: ['/egg2.png'] },
  { name: 'Jumbo 65gm', category: 'Eggs', price: 22, stock: 500, minStock: 50, images: ['/egg2.png'] },
  { name: 'Stander 60gm', category: 'Eggs', price: 20, stock: 500, minStock: 50, images: ['/egg2.png'] },
  { name: 'Starter 48gm', category: 'Eggs', price: 16, stock: 400, minStock: 40, images: ['/egg2.png'] },
  { name: 'Weak Shell', category: 'Eggs', price: 18, stock: 300, minStock: 30, images: ['/egg2.png'] },
  { name: 'Dusty', category: 'Eggs', price: 16, stock: 300, minStock: 30, images: ['/egg2.png'] },
  { name: 'Floor', category: 'Eggs', price: 15, stock: 200, minStock: 20, images: ['/egg2.png'] },
  { name: 'Double White', category: 'Eggs', price: 32, stock: 200, minStock: 20, images: ['/egg2.png'] },
  { name: 'Double Brown', category: 'Eggs', price: 35, stock: 200, minStock: 20, images: ['/egg2.png'] },
  { name: 'Golden', category: 'Eggs', price: 40, stock: 150, minStock: 15, images: ['/egg2.png'] },
  { name: 'Breeder', category: 'Eggs', price: 45, stock: 150, minStock: 15, images: ['/egg2.png'] },
  { name: 'Special', category: 'Eggs', price: 50, stock: 150, minStock: 15, images: ['/egg2.png'] },
  { name: 'pak egg', category: 'Eggs', price: 22, stock: 500, minStock: 50, images: ['/egg2.png'] },
  { name: 'china eggs', category: 'Eggs', price: 20, stock: 500, minStock: 50, images: ['/egg2.png'] }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge');
    console.log('Connected to DB');

    const shops = await Shop.find({});
    for (const shop of shops) {
      const existingCount = await Item.countDocuments({ shopId: shop._id });
      console.log(`Shop: "${shop.name}" (ID: ${shop._id}) has ${existingCount} items.`);
      if (existingCount < 5) {
        console.log(`Seeding default catalog products for "${shop.name}"...`);
        const itemsToInsert = defaultEggProducts.map(p => ({
          ...p,
          shopId: shop._id
        }));
        await Item.insertMany(itemsToInsert);
        console.log(`✅ Seeded ${itemsToInsert.length} products for "${shop.name}"!`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

seedProducts();
