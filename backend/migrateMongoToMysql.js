import mongoose from 'mongoose';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/egge';

async function migrate() {
  console.log('--- Connecting to MongoDB ---');
  await mongoose.connect(mongoUri);
  console.log('MongoDB Connected successfully.');

  console.log('--- Connecting to MySQL ---');
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'yosafze_egg_traders',
    waitForConnections: true,
    connectionLimit: 10
  });

  await pool.query('SET FOREIGN_KEY_CHECKS = 0;');

  // Truncate existing tables to start clean with 1, 2, 3...
  const tables = [
    'sale_items', 'sales', 'order_items', 'orders', 'customer_cart_items',
    'customers', 'damaged_products', 'expenses', 'items', 'cash_sessions',
    'settings', 'users', 'shops', 'system_updates'
  ];
  for (const t of tables) {
    try {
      await pool.query(`TRUNCATE TABLE \`${t}\`;`);
    } catch (e) {
      console.warn(`Truncate ${t}:`, e.message);
    }
  }

  const db = mongoose.connection.db;

  const shopIdMap = {};
  const userIdMap = {};
  const itemIdMap = {};
  const customerIdMap = {};
  const orderIdMap = {};
  const saleIdMap = {};

  // 1. Migrate Shops (1, 2, 3...)
  console.log('Migrating shops...');
  const shops = await db.collection('shops').find({}).toArray();
  for (const s of shops) {
    const [res] = await pool.execute(`
      INSERT INTO shops (name, address, status, contactNumber, logoUrl, ownerFullName, ownerEmail, ownerPhone, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      s.name || 'Shop',
      s.address || null,
      s.status || 'active',
      s.contactNumber || null,
      s.logoUrl || null,
      s.ownerDetails?.fullName || null,
      s.ownerDetails?.email || null,
      s.ownerDetails?.phone || null,
      s.createdAt ? new Date(s.createdAt) : new Date(),
      s.updatedAt ? new Date(s.updatedAt) : new Date()
    ]);
    shopIdMap[s._id.toString()] = res.insertId;
  }
  console.log(`✓ Migrated ${shops.length} shops with IDs: 1 to ${shops.length}`);

  // 2. Migrate Users (1, 2, 3...)
  console.log('Migrating users...');
  const users = await db.collection('users').find({}).toArray();
  for (const u of users) {
    const mappedShopId = u.shopId ? (shopIdMap[u.shopId.toString()] || null) : null;
    const [res] = await pool.execute(`
      INSERT INTO users (username, password, fullName, role, shopId, status, preferredShift, phoneNumber, email, lastLogged, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      u.username,
      u.password || null,
      u.fullName || u.username,
      u.role || 'cashier',
      mappedShopId,
      u.status || 'active',
      u.preferredShift || 'both',
      u.phoneNumber || null,
      u.email || null,
      u.lastLogged ? new Date(u.lastLogged) : null,
      u.createdAt ? new Date(u.createdAt) : new Date(),
      u.updatedAt ? new Date(u.updatedAt) : new Date()
    ]);
    userIdMap[u._id.toString()] = res.insertId;
  }
  console.log(`✓ Migrated ${users.length} users with IDs: 1 to ${users.length}`);

  // 3. Migrate Items (1, 2, 3...)
  console.log('Migrating items...');
  const items = await db.collection('items').find({}).toArray();
  for (const it of items) {
    const mappedShopId = it.shopId ? (shopIdMap[it.shopId.toString()] || 1) : 1;
    const [res] = await pool.execute(`
      INSERT INTO items (
        shopId, name, category, stock, minStock, price, costPrice, pricePerPeti, pricePerTray, pricePerEgg,
        images, description, mfgDate, expiryDate, unitType, traysPerPeti, eggsPerTray, petiQuantity, trayQuantity, eggQuantity,
        supplierName, supplierPhone, supplierLocation, totalPurchaseCost, amountPaidToSupplier, cashPaidToSupplier,
        bankPaidToSupplier, dueAmountToSupplier, paymentMethod, paymentReceipt, isOnlinePayment, lastUpdated, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mappedShopId,
      it.name || 'Unnamed Item',
      it.category || 'General',
      Number(it.stock) || 0,
      Number(it.minStock) || 0,
      Number(it.price) || 0,
      Number(it.costPrice) || 0,
      Number(it.pricePerPeti) || 0,
      Number(it.pricePerTray) || 0,
      Number(it.pricePerEgg) || 0,
      Array.isArray(it.images) ? JSON.stringify(it.images) : '[]',
      it.description || '',
      it.mfgDate ? new Date(it.mfgDate) : null,
      it.expiryDate ? new Date(it.expiryDate) : null,
      it.unitType || 'peti',
      Number(it.traysPerPeti) || 12,
      Number(it.eggsPerTray) || 30,
      Number(it.petiQuantity) || 0,
      Number(it.trayQuantity) || 0,
      Number(it.eggQuantity) || 0,
      it.supplierName || '',
      it.supplierPhone || '',
      it.supplierLocation || '',
      Number(it.totalPurchaseCost) || 0,
      Number(it.amountPaidToSupplier) || 0,
      Number(it.cashPaidToSupplier) || 0,
      Number(it.bankPaidToSupplier) || 0,
      Number(it.dueAmountToSupplier) || 0,
      it.paymentMethod || 'Cash',
      it.paymentReceipt || '',
      it.isOnlinePayment ? 1 : 0,
      it.lastUpdated || null,
      it.createdAt ? new Date(it.createdAt) : new Date(),
      it.updatedAt ? new Date(it.updatedAt) : new Date()
    ]);
    itemIdMap[it._id.toString()] = res.insertId;
  }
  console.log(`✓ Migrated ${items.length} items with IDs: 1 to ${items.length}`);

  // 4. Migrate Customers (1, 2, 3...)
  console.log('Migrating customers...');
  const customers = await db.collection('customers').find({}).toArray();
  for (const c of customers) {
    const mappedShopId = c.shopId ? (shopIdMap[c.shopId.toString()] || 1) : 1;
    const [res] = await pool.execute(`
      INSERT INTO customers (fullName, email, password, phone, address, shopId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      c.fullName || 'Customer',
      c.email,
      c.password || '',
      c.phone || '',
      c.address || '',
      mappedShopId,
      c.createdAt ? new Date(c.createdAt) : new Date(),
      c.updatedAt ? new Date(c.updatedAt) : new Date()
    ]);
    const newCustId = res.insertId;
    customerIdMap[c._id.toString()] = newCustId;

    if (Array.isArray(c.cart)) {
      for (const cartItem of c.cart) {
        const mappedItemId = cartItem.itemId ? (itemIdMap[cartItem.itemId.toString()] || null) : null;
        if (!mappedItemId) continue;
        await pool.execute(`
          INSERT INTO customer_cart_items (customerId, itemId, name, unit, price, image, quantity)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          newCustId,
          mappedItemId,
          cartItem.name || '',
          cartItem.unit || 'egg',
          Number(cartItem.price) || 0,
          cartItem.image || null,
          Number(cartItem.quantity) || 1
        ]);
      }
    }
  }
  console.log(`✓ Migrated ${customers.length} customers with IDs: 1 to ${customers.length}`);

  // 5. Migrate Orders (1, 2, 3...)
  console.log('Migrating orders...');
  const orders = await db.collection('orders').find({}).toArray();
  for (const ord of orders) {
    const mappedShopId = ord.shopId ? (shopIdMap[ord.shopId.toString()] || 1) : 1;
    const mappedCustId = ord.customerId ? (customerIdMap[ord.customerId.toString()] || 1) : 1;
    const [res] = await pool.execute(`
      INSERT INTO orders (shopId, customerId, totalAmount, shippingFullName, shippingPhone, shippingAddress, shippingCity, paymentMethod, paymentStatus, orderStatus, transactionId, paymentProof, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mappedShopId,
      mappedCustId,
      Number(ord.totalAmount) || 0,
      ord.shippingDetails?.fullName || null,
      ord.shippingDetails?.phone || null,
      ord.shippingDetails?.address || null,
      ord.shippingDetails?.city || null,
      ord.paymentMethod || 'COD',
      ord.paymentStatus || 'PENDING',
      ord.orderStatus || 'PROCESSING',
      ord.transactionId || null,
      ord.paymentProof || null,
      ord.createdAt ? new Date(ord.createdAt) : new Date(),
      ord.updatedAt ? new Date(ord.updatedAt) : new Date()
    ]);
    const newOrderId = res.insertId;
    orderIdMap[ord._id.toString()] = newOrderId;

    if (Array.isArray(ord.items)) {
      for (const itm of ord.items) {
        const mappedItemId = itm.itemId ? (itemIdMap[itm.itemId.toString()] || null) : null;
        await pool.execute(`
          INSERT INTO order_items (orderId, itemId, name, price, quantity, image)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          newOrderId,
          mappedItemId,
          itm.name || '',
          Number(itm.price) || 0,
          Number(itm.quantity) || 1,
          itm.image || null
        ]);
      }
    }
  }
  console.log(`✓ Migrated ${orders.length} orders with IDs: 1 to ${orders.length}`);

  // 6. Migrate Sales (1, 2, 3...)
  console.log('Migrating sales...');
  const sales = await db.collection('sales').find({}).toArray();
  for (const sal of sales) {
    const mappedShopId = sal.shopId ? (shopIdMap[sal.shopId.toString()] || 1) : 1;
    const mappedCashierId = sal.cashierId ? (userIdMap[sal.cashierId.toString()] || null) : null;
    const mappedCustId = sal.customerId ? (customerIdMap[sal.customerId.toString()] || null) : null;
    const mappedOrderId = sal.orderId ? (orderIdMap[sal.orderId.toString()] || null) : null;

    const [res] = await pool.execute(`
      INSERT INTO sales (
        shopId, totalAmount, totalProfit, serialNumber, invoiceNumber, saleDate, status, returnReason,
        cashierId, cashierName, customerName, customerPhone, paymentMethod, cashPaid, bankPaid, dueAmount,
        paymentReceipt, paymentProof, transactionId, isCredit, orderId, customerId, customerEmail,
        isOnlineOrder, orderSource, approvalStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mappedShopId,
      Number(sal.totalAmount) || 0,
      Number(sal.totalProfit) || 0,
      Number(sal.serialNumber) || 0,
      sal.invoiceNumber || '',
      sal.saleDate ? new Date(sal.saleDate) : new Date(),
      sal.status || 'completed',
      sal.returnReason || '',
      mappedCashierId,
      sal.cashierName || null,
      sal.customerName || '',
      sal.customerPhone || '',
      sal.paymentMethod || 'CASH',
      Number(sal.cashPaid) || 0,
      Number(sal.bankPaid) || 0,
      Number(sal.dueAmount) || 0,
      sal.paymentReceipt || '',
      sal.paymentProof || '',
      sal.transactionId || '',
      sal.isCredit ? 1 : 0,
      mappedOrderId,
      mappedCustId,
      sal.customerEmail || '',
      sal.isOnlineOrder ? 1 : 0,
      sal.orderSource || 'WALK_IN_POS',
      sal.approvalStatus || 'APPROVED',
      sal.createdAt ? new Date(sal.createdAt) : new Date(),
      sal.updatedAt ? new Date(sal.updatedAt) : new Date()
    ]);
    const newSaleId = res.insertId;
    saleIdMap[sal._id.toString()] = newSaleId;

    if (Array.isArray(sal.items)) {
      for (const itm of sal.items) {
        const mappedProdId = itm.productId ? (itemIdMap[itm.productId.toString()] || null) : null;
        await pool.execute(`
          INSERT INTO sale_items (saleId, productId, name, quantity, price, costPrice, subtotal, profit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          newSaleId,
          mappedProdId,
          itm.name || '',
          Number(itm.quantity) || 1,
          Number(itm.price) || 0,
          Number(itm.costPrice) || 0,
          Number(itm.subtotal) || 0,
          Number(itm.profit) || 0
        ]);
      }
    }
  }
  console.log(`✓ Migrated ${sales.length} sales with IDs: 1 to ${sales.length}`);

  // 7. Migrate Expenses (1, 2, 3...)
  console.log('Migrating expenses...');
  const expenses = await db.collection('expenses').find({}).toArray();
  for (const exp of expenses) {
    const mappedShopId = exp.shopId ? (shopIdMap[exp.shopId.toString()] || 1) : 1;
    await pool.execute(`
      INSERT INTO expenses (shopId, title, category, amount, paymentMethod, paymentSource, expenseDate, notes, createdBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mappedShopId,
      exp.title || 'Expense',
      exp.category || 'Other',
      Number(exp.amount) || 0,
      exp.paymentMethod || 'CASH',
      exp.paymentSource || 'CASH',
      exp.expenseDate ? new Date(exp.expenseDate) : new Date(),
      exp.notes || '',
      exp.createdBy || 'Shop Admin',
      exp.createdAt ? new Date(exp.createdAt) : new Date(),
      exp.updatedAt ? new Date(exp.updatedAt) : new Date()
    ]);
  }
  console.log(`✓ Migrated ${expenses.length} expenses with IDs: 1 to ${expenses.length}`);

  // 8. Migrate Damaged Products (1, 2, 3...)
  console.log('Migrating damaged products...');
  const damages = await db.collection('damagedproducts').find({}).toArray();
  for (const d of damages) {
    const mappedShopId = d.shopId ? (shopIdMap[d.shopId.toString()] || 1) : 1;
    const mappedProdId = d.productId ? (itemIdMap[d.productId.toString()] || null) : null;
    await pool.execute(`
      INSERT INTO damaged_products (shopId, productName, productId, quantity, petiQuantity, trayQuantity, eggQuantity, unitType, deductedEggs, unitPrice, totalLoss, reason, damageDate, notes, reportedBy, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mappedShopId,
      d.productName || 'Damaged Item',
      mappedProdId,
      Number(d.quantity) || 0,
      Number(d.petiQuantity) || 0,
      Number(d.trayQuantity) || 0,
      Number(d.eggQuantity) || 0,
      d.unitType || 'egg',
      Number(d.deductedEggs) || 0,
      Number(d.unitPrice) || 0,
      Number(d.totalLoss) || 0,
      d.reason || 'Egg Breakage / Crack',
      d.damageDate ? new Date(d.damageDate) : new Date(),
      d.notes || '',
      d.reportedBy || 'Shop Admin',
      d.createdAt ? new Date(d.createdAt) : new Date(),
      d.updatedAt ? new Date(d.updatedAt) : new Date()
    ]);
  }
  console.log(`✓ Migrated ${damages.length} damaged products with IDs: 1 to ${damages.length}`);

  // 9. Migrate Settings (1, 2, 3...)
  console.log('Migrating settings...');
  const settings = await db.collection('settings').find({}).toArray();
  for (const st of settings) {
    const mappedShopId = st.shopId ? (shopIdMap[st.shopId.toString()] || null) : null;
    if (!mappedShopId) continue;
    await pool.execute(`
      INSERT INTO settings (shopId, shopName, address, phone, email, currency, logoUrl, ownerPassword, taxRate, ownerFullName, ownerEmail, ownerPhone, easypaisaNumber, easypaisaEnabled, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      mappedShopId,
      st.shopName || 'Egg Station POS',
      st.address || '',
      st.phone || '',
      st.email || '',
      st.currency || '$',
      st.logoUrl || '',
      st.ownerPassword || 'admin123',
      Number(st.taxRate) || 0,
      st.ownerFullName || '',
      st.ownerEmail || '',
      st.ownerPhone || '',
      st.easypaisaNumber || '',
      st.easypaisaEnabled ? 1 : 0,
      st.createdAt ? new Date(st.createdAt) : new Date(),
      st.updatedAt ? new Date(st.updatedAt) : new Date()
    ]);
  }
  console.log(`✓ Migrated settings with IDs: 1 to ...`);

  // 10. Migrate System Updates (1, 2, 3...)
  console.log('Migrating system updates...');
  const sysUpdates = await db.collection('systemupdates').find({}).toArray();
  for (const su of sysUpdates) {
    await pool.execute(`
      INSERT INTO system_updates (category, iconType, items, isActive, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `, [
      su.category || 'New Features',
      su.iconType || 'zap',
      Array.isArray(su.items) ? JSON.stringify(su.items) : '[]',
      su.isActive !== false ? 1 : 0,
      su.createdAt ? new Date(su.createdAt) : new Date()
    ]);
  }
  console.log(`✓ Migrated ${sysUpdates.length} system updates with IDs: 1 to ${sysUpdates.length}`);

  console.log('=== ALL TABLES CONVERTED TO CLEAN 1, 2, 3... AUTO INCREMENT IDS ===');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1;');
  await pool.end();
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
