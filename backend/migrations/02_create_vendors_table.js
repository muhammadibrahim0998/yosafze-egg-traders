import pool from '../config/mysql.js';

export async function up() {
  console.log('Running migration: Create vendors table');
  const query = `
    CREATE TABLE IF NOT EXISTS vendors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shopId INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) DEFAULT '',
      location VARCHAR(255) DEFAULT '',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_shop_name (shopId, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  try {
    await pool.query(query);
    console.log('Migration successful: vendors table created/verified.');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

if (process.argv[1] && process.argv[1].endsWith('02_create_vendors_table.js')) {
  up().then(() => process.exit(0)).catch(() => process.exit(1));
}
