const { query } = require('./lib/db');
async function test() {
  try {
    const res = await query('SELECT inv.serial_number, p.model FROM inventory_serials inv JOIN products p ON inv.product_id = p.id LIMIT 1');
    console.log(res);
  } catch(e) { console.error(e); }
  process.exit(0);
}
test();
