import { query } from './lib/db';
async function main() {
  const items = await query('SELECT * FROM order_items WHERE product_id = 0 OR product_id IS NULL LIMIT 5');
  console.log('Orphan items:', items);
  
  // also check if there are items from the most recent order
  const lastOrderItems = await query('SELECT * FROM order_items ORDER BY order_id DESC LIMIT 5');
  console.log('Last order items:', lastOrderItems);
  
  process.exit(0);
}
main();
