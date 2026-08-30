require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'excellent_solar',
    });

    console.log("Connected! Clearing tables...");
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    await conn.query('TRUNCATE TABLE quotation_items;');
    await conn.query('TRUNCATE TABLE quotations;');
    await conn.query('TRUNCATE TABLE customers;');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log("Database cleared successfully!");
    conn.end();
  } catch (error) {
    console.error("Error clearing database:", error);
  }
}
run();
