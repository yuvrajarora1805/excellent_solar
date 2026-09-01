const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'solar_user',
    password: 'solar123',
    database: 'excellent_solar'
  });
  
  const [installPhotos] = await pool.query(`
    SELECT ip.file_name, ip.file_path, ip.category, i.project_id 
    FROM installation_photos ip
    JOIN installations i ON ip.installation_id = i.id
    WHERE i.project_id = 1
  `);
  console.log("Install Photos:", installPhotos);
  
  const [surveyPhotos] = await pool.query(`
    SELECT ssp.file_name, ssp.file_path, ssp.category, ss.project_id
    FROM site_survey_photos ssp
    JOIN site_surveys ss ON ssp.site_survey_id = ss.id
    WHERE ss.project_id = 1
  `);
  console.log("Survey Photos:", surveyPhotos);
  pool.end();
}
run().catch(console.error);
