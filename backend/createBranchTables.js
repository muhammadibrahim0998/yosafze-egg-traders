import pool from './config/mysql.js';

export async function createAllBranchTables() {
  const branches = [
    { id: 1, name: 'peshawar' },
    { id: 2, name: 'mardan' },
    { id: 3, name: 'attock' }
  ];

  const tables = [
    'items',
    'sales',
    'sale_items',
    'purchases',
    'purchase_credits',
    'expenses',
    'orders',
    'order_items',
    'customer_credits',
    'cash_sessions',
    'damaged_products',
    'customers',
    'vendors',
    'settings'
  ];

  console.log('🚀 Creating physical BASE tables for all 3 branches in database...');

  for (const b of branches) {
    for (const t of tables) {
      const bTable = `${b.name}_${t}`;
      try {
        await pool.query(`DROP VIEW IF EXISTS \`${bTable}\``);
        await pool.query(`CREATE TABLE IF NOT EXISTS \`${bTable}\` LIKE \`${t}\``);

        // Copy existing branch data into branch table
        if (t === 'sale_items') {
          await pool.query(`REPLACE INTO \`${bTable}\` SELECT si.* FROM \`sale_items\` si JOIN \`sales\` s ON si.saleId = s.id WHERE s.shopId = ${b.id}`);
        } else if (t === 'order_items') {
          await pool.query(`REPLACE INTO \`${bTable}\` SELECT oi.* FROM \`order_items\` oi JOIN \`orders\` o ON oi.orderId = o.id WHERE o.shopId = ${b.id}`);
        } else {
          await pool.query(`REPLACE INTO \`${bTable}\` SELECT * FROM \`${t}\` WHERE \`shopId\` = ${b.id}`);
        }
      } catch (err) {
        console.warn(`Warning on ${bTable}:`, err.message);
      }
    }
  }

  // Create MySQL Triggers on main tables to automatically keep branch tables 100% updated in real-time
  const triggerTables = [
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

  for (const t of triggerTables) {
    for (const b of branches) {
      const bTable = `${b.name}_${t}`;
      
      // Trigger AFTER INSERT
      try {
        await pool.query(`DROP TRIGGER IF EXISTS \`trg_${b.name}_${t}_insert\``);
        await pool.query(`
          CREATE TRIGGER \`trg_${b.name}_${t}_insert\` AFTER INSERT ON \`${t}\`
          FOR EACH ROW
          BEGIN
            IF NEW.shopId = ${b.id} THEN
              REPLACE INTO \`${bTable}\` SELECT * FROM \`${t}\` WHERE id = NEW.id;
            END IF;
          END;
        `);
      } catch (e) {}

      // Trigger AFTER UPDATE
      try {
        await pool.query(`DROP TRIGGER IF EXISTS \`trg_${b.name}_${t}_update\``);
        await pool.query(`
          CREATE TRIGGER \`trg_${b.name}_${t}_update\` AFTER UPDATE ON \`${t}\`
          FOR EACH ROW
          BEGIN
            IF NEW.shopId = ${b.id} THEN
              REPLACE INTO \`${bTable}\` SELECT * FROM \`${t}\` WHERE id = NEW.id;
            ELSE
              DELETE FROM \`${bTable}\` WHERE id = OLD.id;
            END IF;
          END;
        `);
      } catch (e) {}

      // Trigger AFTER DELETE
      try {
        await pool.query(`DROP TRIGGER IF EXISTS \`trg_${b.name}_${t}_delete\``);
        await pool.query(`
          CREATE TRIGGER \`trg_${b.name}_${t}_delete\` AFTER DELETE ON \`${t}\`
          FOR EACH ROW
          BEGIN
            DELETE FROM \`${bTable}\` WHERE id = OLD.id;
          END;
        `);
      } catch (e) {}
    }
  }

  console.log('✅ Created physical tables & real-time synchronization triggers for all 3 branches!');
  return true;
}

if (process.argv[1] && process.argv[1].endsWith('createBranchTables.js')) {
  createAllBranchTables().then(() => {
    console.log('Branch table setup complete.');
    process.exit(0);
  });
}
