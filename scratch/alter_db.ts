import { query } from '../lib/db';
async function main() {
  try {
    const res1 = await query("ALTER TABLE site_survey_photos ADD COLUMN uploaded_by INT NULL");
    console.log("Added uploaded_by to site_survey_photos");
  } catch(e: any) { console.error("Error 1:", e.message); }
  
  try {
    const res2 = await query("ALTER TABLE installation_photos ADD COLUMN uploaded_by INT NULL");
    console.log("Added uploaded_by to installation_photos");
  } catch(e: any) { console.error("Error 2:", e.message); }
  
  process.exit(0);
}
main();
