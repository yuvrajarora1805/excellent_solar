import { query } from './lib/db';
async function main() {
  const order = await query('SELECT * FROM orders ORDER BY id DESC LIMIT 1');
  console.log(order);
  process.exit(0);
}
main();
