import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const results = [];

    await execute(`
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
    results.push('Created project_reservations table');

    await execute(`
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
    results.push('Created quotation_items table');

    const safeAlter = async (table: string, queryStr: string) => {
      try {
        await execute(queryStr);
        results.push(`Altered ${table} successfully`);
      } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          results.push(`Columns already exist in ${table}`);
        } else {
          results.push(`Error altering ${table}: ${e.message}`);
        }
      }
    };

    await safeAlter('system_templates', `
      ALTER TABLE system_templates 
      ADD COLUMN code VARCHAR(100),
      ADD COLUMN system_type VARCHAR(100),
      ADD COLUMN template_type VARCHAR(100),
      ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE',
      ADD COLUMN created_by INT
    `);

    await safeAlter('system_template_items', `
      ALTER TABLE system_template_items 
      ADD COLUMN unit VARCHAR(50),
      ADD COLUMN is_optional BOOLEAN DEFAULT FALSE,
      ADD COLUMN remarks TEXT
    `);

    await safeAlter('service_tickets', `
      ALTER TABLE service_tickets 
      ADD COLUMN project_id INT,
      ADD COLUMN assigned_to INT,
      ADD COLUMN created_by INT,
      ADD COLUMN resolved_at TIMESTAMP NULL,
      ADD COLUMN resolution TEXT,
      ADD COLUMN customer_rating INT,
      ADD COLUMN customer_feedback TEXT
    `);

    await safeAlter('products', `
      ALTER TABLE products 
      ADD COLUMN reserved_stock INT DEFAULT 0
    `);

    await safeAlter('quotations', `
      ALTER TABLE quotations 
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

    return NextResponse.json({ success: true, messages: results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message || 'Migration failed' }, { status: 500 });
  }
}
