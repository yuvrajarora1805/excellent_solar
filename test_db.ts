import { query } from './lib/db';
async function main() {
  const order = await query('SELECT id, customer_name, customer_mobile, delivery_address, status FROM orders ORDER BY id DESC LIMIT 2');
  console.log('Orders:', JSON.stringify(order, null, 2));
  process.exit(0);
}
main();
