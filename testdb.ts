import { query } from './lib/db';
async function run() {
  const r = await query('SELECT id, name, status FROM products LIMIT 10');
  console.log(r);
}
run().then(() => process.exit(0)).catch(console.error);
