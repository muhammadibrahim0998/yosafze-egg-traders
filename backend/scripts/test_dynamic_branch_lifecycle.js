import pool from '../config/mysql.js';
import Shop from '../models/Shop.js';
import { createBranchTablesForShop, dropBranchTablesForShop, getBranchPrefix } from '../utils/branchTableManager.js';
import { refreshBranchPrefixes, BRANCH_TABLE_PREFIXES, ALL_BRANCH_PREFIXES } from '../models/dbHelper.js';

async function testLifecycle() {
  console.log('🧪 Starting test for Dynamic Branch Lifecycle (Creation & Deletion)...');

  // Step 1: Create a test shop
  const testShopName = 'Kohat Test Branch';
  console.log(`1. Creating test shop: "${testShopName}"`);
  
  const shop = await Shop.create({
    name: testShopName,
    address: 'Main Bazaar, Kohat',
    contactNumber: '03001234567',
    status: 'active'
  });

  const shopId = shop._id || shop.id;
  const pfx = getBranchPrefix(shop);
  console.log(`   -> Created shop with ID: ${shopId}, Prefix: ${pfx}`);

  // Step 2: Trigger automatic branch table creation
  console.log(`2. Automatically creating all 18 branch tables for "${pfx}"...`);
  await createBranchTablesForShop(shop);
  await refreshBranchPrefixes();

  // Step 3: Verify all 18 tables exist in MySQL
  const [tables] = await pool.query(`SHOW TABLES LIKE '${pfx}__%'`);
  const tableNames = tables.map(r => Object.values(r)[0]);
  console.log(`3. Verified ${tableNames.length} tables created for "${pfx}":`);
  console.log(tableNames);

  if (tableNames.length !== 18) {
    throw new Error(`Expected 18 tables, but found ${tableNames.length}`);
  }

  // Step 4: Test query capability
  const [salesResult] = await pool.query(`SELECT count(*) as count FROM \`${pfx}__sales\``);
  console.log(`4. Successfully queried \`${pfx}__sales\`. Row count: ${salesResult[0].count}`);

  // Step 5: Delete the branch and test automatic drop
  console.log(`5. Deleting test shop and dropping all branch tables...`);
  await dropBranchTablesForShop(shop);
  await pool.query('DELETE FROM `shops` WHERE `id` = ?', [shopId]);
  await refreshBranchPrefixes();

  // Step 6: Verify all 18 tables are removed
  const [remainingTables] = await pool.query(`SHOW TABLES LIKE '${pfx}__%'`);
  console.log(`6. Remaining tables for "${pfx}": ${remainingTables.length}`);

  if (remainingTables.length !== 0) {
    throw new Error(`Expected 0 tables remaining, but found ${remainingTables.length}`);
  }

  console.log('🎉 ALL TESTS PASSED! Dynamic shop creation & deletion works perfectly!');
  process.exit(0);
}

testLifecycle().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

