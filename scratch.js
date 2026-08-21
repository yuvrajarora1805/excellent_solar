const fs = require('fs');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'solar_user',
    password: 'solar123',
    database: 'excellent_solar'
  });

  const files = fs.readdirSync('public/uploads/jobs/3');
  let count = 0;
  for (const file of files) {
    if (file === '.' || file === '..') continue;
    const stat = fs.statSync(`public/uploads/jobs/3/${file}`);
    if (stat.isFile()) {
      // Check if already in DB
      const [rows] = await connection.execute('SELECT id FROM site_survey_photos WHERE file_name = ?', [file]);
      if (rows.length === 0) {
        await connection.execute(
          'INSERT INTO site_survey_photos (site_survey_id, category, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)',
          [1, 'auto_restored', file, `/uploads/jobs/3/${file}`, stat.size, file.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg']
        );
        count++;
      }
    }
  }
  console.log(`Inserted ${count} missing photos`);
  await connection.end();
}
run();
