const mysql = require('mysql2/promise');

async function fixMissingRecords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'solar_user',
    password: 'solar123',
    database: 'excellent_solar'
  });

  try {
    // Find all SURVEY_SUBMITTED projects that don't have a site_survey record
    const [surveys] = await connection.execute(
      `SELECT p.id FROM projects p 
       LEFT JOIN site_surveys ss ON p.id = ss.project_id 
       WHERE (p.status = 'SURVEY_SUBMITTED' OR p.status = 'SURVEY_VERIFIED') AND ss.id IS NULL`
    );

    console.log(`Found ${surveys.length} missing survey records.`);
    
    for (const p of surveys) {
      await connection.execute(
        `INSERT INTO site_surveys (project_id, status, submitted_at, created_by, shading, extra_structure) 
         VALUES (?, ?, NOW(), ?, ?, ?)`,
        [p.id, 'SUBMITTED', 1, false, false]
      );
      console.log(`Created survey record for project ${p.id}`);
    }

    // Find all INSTALLATION_COMPLETED projects that don't have an installations record
    const [installs] = await connection.execute(
      `SELECT p.id FROM projects p 
       LEFT JOIN installations i ON p.id = i.project_id 
       WHERE (p.status = 'INSTALLATION_COMPLETED' OR p.status = 'PROJECT_COMPLETED') AND i.id IS NULL`
    );

    console.log(`Found ${installs.length} missing installation records.`);
    
    for (const p of installs) {
      await connection.execute(
        `INSERT INTO installations (project_id, status, submitted_at, created_by, structure_installed, earthing_completed, wiring_completed, testing_completed) 
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
        [p.id, 'SUBMITTED', 1, true, true, true, true]
      );
      console.log(`Created installation record for project ${p.id}`);
    }

  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

fixMissingRecords();
