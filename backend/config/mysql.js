import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// High Performance MySQL Connection Pool for `yosafze_egg_traders`
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'yosafze_egg_traders',
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

export const testMySQLConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected Successfully: `yosafze_egg_traders`');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    return false;
  }
};

export default pool;
