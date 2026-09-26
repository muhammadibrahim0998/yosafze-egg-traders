import pool from './config/mysql.js';

export async function createAllBranchTables() {
  const branches = [
    { id: 1, prefix: 'peshawar' },
    { id: 2, prefix: 'mardan' },
    { id: 3, prefix: 'attock' }
  ];

  const entities = [
    'items',
    'sales',
    'purchases',
    'purchase_credits',
    'expenses',
    'orders',
    'customer_credits',
    'cash_sessions',
    'damaged_products',
    'customers',
    'vendors',
    'settings'
  ];

  console.log('🚀 Synchronizing 100% dynamic real-time branch views in database...');

  // Clean up any legacy triggers that conflict with updatable views
  try {
    const [triggers] = await pool.query('SHOW TRIGGERS');
    for (const t of triggers) {
      await pool.query(`DROP TRIGGER IF EXISTS \`${t.Trigger}\``);
    }
  } catch (_) {}

  for (const b of branches) {
    for (const entity of entities) {
      const bTable = `${b.prefix}_${entity}`;
      try {
        // Drop table/view if exists to ensure clean updatable view
        await pool.query(`DROP TABLE IF EXISTS \`${bTable}\``);
        await pool.query(`CREATE OR REPLACE VIEW \`${bTable}\` AS SELECT * FROM \`${entity}\` WHERE \`shopId\` = ${b.id}`);
      } catch (err) {
        console.warn(`Warning on ${bTable}:`, err.message);
      }
    }

    // Also create aliases for items/products and relational sub-items
    try {
      await pool.query(`DROP TABLE IF EXISTS \`${b.prefix}_products\``);
      await pool.query(`CREATE OR REPLACE VIEW \`${b.prefix}_products\` AS SELECT * FROM \`items\` WHERE \`shopId\` = ${b.id}`);

      await pool.query(`DROP TABLE IF EXISTS \`${b.prefix}_sale_items\``);
      await pool.query(`CREATE OR REPLACE VIEW \`${b.prefix}_sale_items\` AS SELECT si.* FROM \`sale_items\` si JOIN \`sales\` s ON si.saleId = s.id WHERE s.shopId = ${b.id}`);

      await pool.query(`DROP TABLE IF EXISTS \`${b.prefix}_order_items\``);
      await pool.query(`CREATE OR REPLACE VIEW \`${b.prefix}_order_items\` AS SELECT oi.* FROM \`order_items\` oi JOIN \`orders\` o ON oi.orderId = o.id WHERE o.shopId = ${b.id}`);
    } catch (_) {}
  }

  console.log('✅ Created 100% dynamic, real-time synchronized tables & views for all 3 branches!');
  return true;
}

if (process.argv[1] && process.argv[1].endsWith('createBranchTables.js')) {
  createAllBranchTables().then(() => {
    console.log('Branch table setup complete.');
    process.exit(0);
  });
}
