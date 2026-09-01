const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'excellent_solar'
  });
  const [rows] = await conn.execute('DESCRIBE site_survey_photos');
  console.log('site_survey_photos columns:', rows.map(r => r.Field));
  
  const [rows2] = await conn.execute('DESCRIBE installation_photos');
  console.log('installation_photos columns:', rows2.map(r => r.Field));
  await conn.end();
}
run().catch(console.error);
