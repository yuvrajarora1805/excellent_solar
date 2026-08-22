const mysql = require('mysql2/promise');
async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost', user: 'solar_user', password: 'solar123', database: 'excellent_solar'
    });
    await conn.query(`ALTER TABLE discom_applications 
      ADD COLUMN np_number VARCHAR(100),
      ADD COLUMN processing_fee DECIMAL(10,2),
      ADD COLUMN je_name VARCHAR(100),
      ADD COLUMN je_phone VARCHAR(20)
    `);
    console.log('Columns added successfully');
    conn.end();
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('Columns already exist');
    else console.error(e);
  }
}
run();
