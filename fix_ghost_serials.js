const pool = require('./lib/db').default;
async function fix() {
  const [res] = await pool.execute(`DELETE FROM product_serial_numbers WHERE product_id NOT IN (SELECT id FROM products)`);
  console.log(`Deleted ${res.affectedRows} ghost serial numbers. You can now re-import the FTR.`);
  process.exit(0);
}
fix();
