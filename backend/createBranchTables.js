import pool from './config/mysql.js';
import { ensureAllBranchTablesExist, cleanFlatLegacyTables } from './utils/branchTableManager.js';

export async function createAllBranchTables() {
  console.log('🚀 Setting up pure branch folder database...');

  // 1. Drop all legacy views
  try {
    const [views] = await pool.query("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
    for (const v of views) {
      const viewName = Object.values(v)[0];
      await pool.query(`DROP VIEW IF EXISTS \`${viewName}\``);
    }
  } catch (_) {}

  // 2. Drop all flat legacy clutter tables outside branch folders
  await cleanFlatLegacyTables();

  // 3. Ensure all 18 branch tables exist for all shops dynamically
  await ensureAllBranchTablesExist();

  console.log('🎉 Clean database ready! All flat clutter tables removed. Only branch folders and core tables exist.');
  return true;
}

if (process.argv[1] && process.argv[1].endsWith('createBranchTables.js')) {
  createAllBranchTables().then(() => {
    console.log('Branch table setup complete.');
    process.exit(0);
  });
}


