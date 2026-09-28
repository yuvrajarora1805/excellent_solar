import { query } from './lib/db';
async function main() {
  const qCols = await query("DESCRIBE quotations");
  const pCols = await query("DESCRIBE projects");
  console.log("Quotations:", qCols.map(c => c.Field));
  console.log("Projects:", pCols.map(c => c.Field));
  process.exit(0);
}
main();
