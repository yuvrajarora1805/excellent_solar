import mysql from 'mysql2/promise';
const dbUrl = "mysql://solar_user:solar123@localhost:3306/excellent_solar";
async function run() {
  const pool = mysql.createPool(dbUrl);
  const [rows] = await pool.query('SELECT *, (current_stock - COALESCE(reserved_stock, 0)) AS available_stock FROM products WHERE 1=1 LIMIT 5');
  console.log("Products:", rows);
  pool.end();
}
run().catch(console.error);
