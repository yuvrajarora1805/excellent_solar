import { query } from './lib/db';
async function main() {
  const items = await query('SELECT * FROM order_items ORDER BY id DESC LIMIT 5');
  console.log(items);
  const schema = await query("DESCRIBE order_items");
  console.log(schema);
  process.exit(0);
}
main();
