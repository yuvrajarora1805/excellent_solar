const mysql = require('mysql2/promise');

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost', user: 'solar_user', password: 'solar123', database: 'excellent_solar'
    });

    console.log("Altering quotations...");
    try {
      await conn.query(`ALTER TABLE quotations 
        ADD COLUMN project_id INT,
        ADD COLUMN valid_until DATE,
        ADD COLUMN system_type VARCHAR(100),
        ADD COLUMN capacity_kw DECIMAL(10, 2),
        ADD COLUMN system_template_id INT,
        ADD COLUMN subtotal DECIMAL(12, 2),
        ADD COLUMN discount_amount DECIMAL(12, 2),
        ADD COLUMN discount_percentage DECIMAL(5, 2),
        ADD COLUMN gst_amount DECIMAL(12, 2),
        ADD COLUMN gst_percentage DECIMAL(5, 2),
        ADD COLUMN payment_schedule TEXT,
        ADD COLUMN terms_conditions TEXT,
        ADD COLUMN remarks TEXT,
        ADD COLUMN created_by INT,
        ADD COLUMN sent_at TIMESTAMP NULL,
        ADD COLUMN accepted_at TIMESTAMP NULL,
        ADD COLUMN rejected_at TIMESTAMP NULL,
        ADD COLUMN rejection_reason TEXT
      `);
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') console.error("Error altering quotations:", e.message); }

    console.log("Creating quotation_items...");
    await conn.query(`
      CREATE TABLE IF NOT EXISTS quotation_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        product_id INT,
        description VARCHAR(255),
        quantity INT NOT NULL,
        unit VARCHAR(50),
        unit_price DECIMAL(10, 2) NOT NULL,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        line_total DECIMAL(12, 2) NOT NULL,
        sort_order INT DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Done updating schema!");
    conn.end();
  } catch (error) {
    console.error("Fatal error:", error);
  }
}
run();
