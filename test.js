const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'solar_user',
    password: 'solar123',
    database: 'excellent_solar'
  });
  
  try {
    const surveyId = 1; // ES-2026-0010 survey is id=1
    const [surveys] = await pool.query('SELECT * FROM site_surveys WHERE id = ?', [surveyId]);
    const survey = surveys[0];
    
    if (survey?.project_id) {
      console.log('Project ID:', survey.project_id);
      
      const [project] = await pool.query('SELECT status FROM projects WHERE id = ?', [survey.project_id]);
      if (!project.length) throw new Error('Project not found');
      
      console.log('Old Project Status:', project[0].status);
      
      await pool.query('UPDATE projects SET status = ? WHERE id = ?', ['INSTALLATION_STARTED', survey.project_id]);
      
      await pool.query(
        'INSERT INTO project_status_history (project_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
        [survey.project_id, project[0].status, 'INSTALLATION_STARTED', 1, 'Advanced automatically after survey approval']
      );
      
      console.log('Successfully updated');
    }
  } catch (err) {
    console.error('Failed:', err);
  } finally {
    pool.end();
  }
}
test();
