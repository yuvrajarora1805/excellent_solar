const { createConnection } = require('mysql2/promise');
require('dotenv').config();

async function run() {
  try {
    const conn = await createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'excellent_solar_new',
      port: Number(process.env.MYSQL_PORT) || 3306,
    });
    const [rows] = await conn.query('SHOW COLUMNS FROM products');
    console.log(rows);
    process.exit();
  } catch (e) {
    console.error(e);
  }
}
run();
