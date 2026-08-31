const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost', port: 3309, user: 'solar_user', password: 'solar123', database: 'excellent_solar'
    });

    console.log("Creating project_reservations...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        status VARCHAR(50) DEFAULT 'RESERVED',
        reserved_by INT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY(project_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Creating product_serial_numbers...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS product_serial_numbers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        serial_number VARCHAR(100) NOT NULL UNIQUE,
        product_id INT NOT NULL,
        warehouse_id INT,
        status VARCHAR(50) DEFAULT 'AVAILABLE',
        order_id INT NULL,
        project_id INT NULL,
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Altering system_templates...");
    try {
      await conn.query(`ALTER TABLE system_templates 
        ADD COLUMN code VARCHAR(100),
        ADD COLUMN system_type VARCHAR(100),
        ADD COLUMN template_type VARCHAR(100),
        ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE',
        ADD COLUMN created_by INT
      `);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering system_templates:", e.message); }

    console.log("Altering system_template_items...");
    try {
      await conn.query(`ALTER TABLE system_template_items 
        ADD COLUMN unit VARCHAR(50),
        ADD COLUMN is_optional BOOLEAN DEFAULT FALSE,
        ADD COLUMN remarks TEXT
      `);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering system_template_items:", e.message); }

    console.log("Altering service_tickets...");
    try {
      await conn.query(`ALTER TABLE service_tickets 
        ADD COLUMN project_id INT,
        ADD COLUMN assigned_to INT,
        ADD COLUMN created_by INT,
        ADD COLUMN resolved_at TIMESTAMP NULL,
        ADD COLUMN resolution TEXT,
        ADD COLUMN customer_rating INT,
        ADD COLUMN customer_feedback TEXT
      `);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering service_tickets:", e.message); }

    console.log("Altering products (for reserved_stock)...");
    try {
      await conn.query(`ALTER TABLE products 
        ADD COLUMN reserved_stock INT DEFAULT 0
      `);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering products:", e.message); }

    console.log("Altering discom_applications (for np_confirmed, meter_status, meter_effect, office_approval)...");
    try {
      await conn.query(`ALTER TABLE discom_applications 
        ADD COLUMN np_confirmed TINYINT(1) DEFAULT 0,
        ADD COLUMN np_confirmed_by INT NULL,
        ADD COLUMN np_confirmed_at TIMESTAMP NULL,
        ADD COLUMN meter_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN meter_effect VARCHAR(50) DEFAULT 'NO',
        ADD COLUMN meter_verified_by INT NULL,
        ADD COLUMN meter_verified_at TIMESTAMP NULL,
        ADD COLUMN office_approval_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN office_approval_remarks TEXT NULL,
        ADD COLUMN second_approval_status VARCHAR(50) DEFAULT 'PENDING',
        ADD COLUMN second_approval_remarks TEXT NULL
      `);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering discom_applications:", e.message); }

    console.log("Altering users table (expanding role column to VARCHAR(100))...");
    try {
      await conn.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(100) DEFAULT 'WORKER'`);
    } catch(e) { console.error("Error altering users role:", e.message); }

    console.log("Altering site_survey_photos & installation_photos for uploaded_by...");
    try {
      await conn.query(`ALTER TABLE site_survey_photos ADD COLUMN uploaded_by INT NULL`);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering site_survey_photos:", e.message); }

    try {
      await conn.query(`ALTER TABLE installation_photos ADD COLUMN uploaded_by INT NULL`);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering installation_photos:", e.message); }

    console.log("Done updating schema!");
    conn.end();
  } catch (error) {
    console.error("Fatal error:", error);
  }
}
run();
