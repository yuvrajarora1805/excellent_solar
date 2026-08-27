import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const results = [];

    await execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        order_type ENUM('PROJECT', 'RETAIL') DEFAULT 'PROJECT',
        customer_id INT,
        customer_name VARCHAR(255) NOT NULL,
        customer_mobile VARCHAR(20),
        delivery_address TEXT,
        vehicle_number VARCHAR(50),
        driver_name VARCHAR(255),
        driver_mobile VARCHAR(20),
        vehicle_photo_path VARCHAR(500),
        total_amount DECIMAL(12, 2) DEFAULT 0,
        status ENUM('DRAFT', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED') DEFAULT 'DRAFT',
        created_by INT,
        dispatched_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created orders table');

    await execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        line_total DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created order_items table');

    await execute(`
      CREATE TABLE IF NOT EXISTS order_serials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        serial_number VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created order_serials table');

    // Auto-seed default Solar Panel product BIN-21-615 if products table is empty
    await execute(`
      INSERT INTO products (id, product_code, name, category, unit, current_stock)
      SELECT 1, 'BIN-21-615', 'Solar Panel 540W/550W (BIN-21-615)', 'SOLAR_PANEL', 'Piece', 0
      FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM products WHERE id = 1 OR product_code = 'BIN-21-615');
    `);
    results.push('Seeded default BIN-21-615 product');


    await execute(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        warehouse_type VARCHAR(50) DEFAULT 'MAIN',
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pin_code VARCHAR(10),
        gps_latitude DECIMAL(10, 8),
        gps_longitude DECIMAL(11, 8),
        manager_id INT,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created warehouses table');


    await execute(`
      CREATE TABLE IF NOT EXISTS product_serial_numbers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        serial_number VARCHAR(100) NOT NULL,
        warehouse_id INT,
        current_location VARCHAR(50) DEFAULT 'WAREHOUSE',
        project_id INT,
        purchase_id INT,
        installation_id INT,
        manufacturing_date DATE,
        warranty_expiry DATE,
        purchase_price DECIMAL(10, 2),
        remarks TEXT,
        status VARCHAR(50) DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_serial (serial_number),
        INDEX idx_product_id (product_id),
        INDEX idx_warehouse_id (warehouse_id),
        INDEX idx_current_location (current_location),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created product_serial_numbers table');

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
        unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        line_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
        sort_order INT DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created quotation_items table');

    await execute(`
      CREATE TABLE IF NOT EXISTS system_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE,
        description TEXT,
        system_type VARCHAR(100),
        capacity_kw DECIMAL(10, 2),
        template_type VARCHAR(100) DEFAULT 'STANDARD',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created system_templates table');

    await execute(`
      CREATE TABLE IF NOT EXISTS system_template_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        system_template_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(50) DEFAULT 'Piece',
        is_optional BOOLEAN DEFAULT FALSE,
        sort_order INT DEFAULT 0,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (system_template_id) REFERENCES system_templates(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    results.push('Created system_template_items table');



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

    await safeAlter('projects', `
      ALTER TABLE projects 
      ADD COLUMN assigned_to INT NULL,
      ADD COLUMN installation_date DATE NULL
    `);

    await safeAlter('products', `
      ALTER TABLE products 
      ADD COLUMN reserved_stock INT DEFAULT 0
    `);

    await safeAlter('products', `
      ALTER TABLE products 
      ADD COLUMN selling_price DECIMAL(10, 2) DEFAULT NULL
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
