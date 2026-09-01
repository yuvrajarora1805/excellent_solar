const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'excellent_solar'
  });
  
  try {
    await conn.execute("ALTER TABLE site_survey_photos ADD COLUMN uploaded_by INT NULL");
    console.log("Added uploaded_by to site_survey_photos");
  } catch(e) { console.error("Error 1:", e.message); }
  
  try {
    await conn.execute("ALTER TABLE installation_photos ADD COLUMN uploaded_by INT NULL");
    console.log("Added uploaded_by to installation_photos");
  } catch(e) { console.error("Error 2:", e.message); }
  
  await conn.end();
}
main();
