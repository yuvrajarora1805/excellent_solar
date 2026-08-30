import { query, queryOne, insert, execute, transaction } from '@/lib/db';
import type { ProductSerialNumber, SerialLocation, SerialStatus, Warehouse } from '@/types';

export const warehouseDb = {
  findAll: async (options?: {
    status?: string;
    warehouse_type?: string;
  }): Promise<Warehouse[]> => {
    let sql = `
      SELECT w.*, u.name as manager_name
      FROM warehouses w
      LEFT JOIN users u ON w.manager_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.status) {
      sql += ' AND w.status = ?';
      params.push(options.status);
    }
    if (options?.warehouse_type) {
      sql += ' AND w.warehouse_type = ?';
      params.push(options.warehouse_type);
    }

    sql += ' ORDER BY w.name ASC';
    return query<Warehouse>(sql, params);
  },

  findById: async (id: number): Promise<Warehouse | null> => {
    return queryOne<Warehouse>(
      `SELECT w.*, u.name as manager_name
       FROM warehouses w
       LEFT JOIN users u ON w.manager_id = u.id
       WHERE w.id = ?`,
      [id]
    );
  },

  findByCode: async (code: string): Promise<Warehouse | null> => {
    return queryOne<Warehouse>('SELECT * FROM warehouses WHERE code = ?', [code]);
  },

  create: async (data: Omit<Warehouse, 'id' | 'created_at' | 'updated_at' | 'manager'>): Promise<number> => {
    return insert(
      'INSERT INTO warehouses (code, name, warehouse_type, address, city, state, pin_code, gps_latitude, gps_longitude, manager_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.code,
        data.name,
        data.warehouse_type,
        data.address || null,
        data.city || null,
        data.state || null,
        data.pin_code || null,
        data.gps_latitude || null,
        data.gps_longitude || null,
        data.manager_id || null,
        data.status,
      ]
    );
  },

  update: async (id: number, data: Partial<Omit<Warehouse, 'id' | 'created_at' | 'updated_at' | 'manager'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.code) {
      fields.push('code = ?');
      values.push(data.code);
    }
    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.warehouse_type) {
      fields.push('warehouse_type = ?');
      values.push(data.warehouse_type);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      values.push(data.city);
    }
    if (data.state !== undefined) {
      fields.push('state = ?');
      values.push(data.state);
    }
    if (data.pin_code !== undefined) {
      fields.push('pin_code = ?');
      values.push(data.pin_code);
    }
    if (data.gps_latitude !== undefined) {
      fields.push('gps_latitude = ?');
      values.push(data.gps_latitude);
    }
    if (data.gps_longitude !== undefined) {
      fields.push('gps_longitude = ?');
      values.push(data.gps_longitude);
    }
    if (data.manager_id !== undefined) {
      fields.push('manager_id = ?');
      values.push(data.manager_id);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(`UPDATE warehouses SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM warehouses WHERE id = ?', [id]);
  },
};

export const serialNumberDb = {
  findAll: async (options?: {
    product_id?: number;
    warehouse_id?: number;
    project_id?: number;
    current_location?: SerialLocation;
    status?: SerialStatus;
    limit?: number;
    offset?: number;
  }): Promise<ProductSerialNumber[]> => {
    let sql = `
      SELECT psn.*, p.name as product_name, p.product_code, w.name as warehouse_name, w.code as warehouse_code
      FROM product_serial_numbers psn
      LEFT JOIN products p ON psn.product_id = p.id
      LEFT JOIN warehouses w ON psn.warehouse_id = w.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.product_id) {
      sql += ' AND psn.product_id = ?';
      params.push(options.product_id);
    }
    if (options?.warehouse_id) {
      sql += ' AND psn.warehouse_id = ?';
      params.push(options.warehouse_id);
    }
    if (options?.project_id) {
      sql += ' AND psn.project_id = ?';
      params.push(options.project_id);
    }
    if (options?.current_location) {
      sql += ' AND psn.current_location = ?';
      params.push(options.current_location);
    }
    if (options?.status) {
      sql += ' AND psn.status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY psn.created_at DESC';

    const limitVal = options?.limit ? Number(options.limit) : 2000;
    sql += ` LIMIT ${limitVal}`;
    if (options?.offset) {
      sql += ` OFFSET ${Number(options.offset)}`;
    }

    return query<ProductSerialNumber>(sql, params);

  },

  findById: async (id: number): Promise<ProductSerialNumber | null> => {
    return queryOne<ProductSerialNumber>(
      `SELECT psn.*, p.name as product_name, p.product_code, w.name as warehouse_name, w.code as warehouse_code
       FROM product_serial_numbers psn
       LEFT JOIN products p ON psn.product_id = p.id
       LEFT JOIN warehouses w ON psn.warehouse_id = w.id
       WHERE psn.id = ?`,
      [id]
    );
  },

  findBySerialNumber: async (serialNumber: string): Promise<ProductSerialNumber | null> => {
    return queryOne<ProductSerialNumber>(
      `SELECT psn.*, p.name as product_name, p.product_code, w.name as warehouse_name
       FROM product_serial_numbers psn
       LEFT JOIN products p ON psn.product_id = p.id
       LEFT JOIN warehouses w ON psn.warehouse_id = w.id
       WHERE psn.serial_number = ?`,
      [serialNumber]
    );
  },

  // Search serial number across all products
  search: async (searchTerm: string): Promise<ProductSerialNumber[]> => {
    return query<ProductSerialNumber>(
      `SELECT psn.*, p.name as product_name, p.product_code, pr.project_id, c.name as customer_name
       FROM product_serial_numbers psn
       LEFT JOIN products p ON psn.product_id = p.id
       LEFT JOIN projects pr ON psn.project_id = pr.id
       LEFT JOIN customers c ON pr.customer_id = c.id
       WHERE psn.serial_number LIKE ?
       ORDER BY psn.created_at DESC
       LIMIT 50`,
      [`%${searchTerm}%`]
    );
  },

  // Get available serial numbers for a product
  getAvailable: async (productId: number, warehouseId?: number): Promise<ProductSerialNumber[]> => {
    let sql = `
      SELECT * FROM product_serial_numbers
      WHERE product_id = ? AND status = 'AVAILABLE' AND current_location = 'WAREHOUSE'
    `;
    const params: any[] = [productId];

    if (warehouseId) {
      sql += ' AND warehouse_id = ?';
      params.push(warehouseId);
    }

    sql += ' ORDER BY created_at ASC';
    return query<ProductSerialNumber>(sql, params);
  },

  create: async (data: Omit<ProductSerialNumber, 'id' | 'created_at' | 'updated_at' | 'product' | 'warehouse'>): Promise<number> => {
    return insert(
      `INSERT INTO product_serial_numbers (product_id, serial_number, warehouse_id, current_location, project_id,
       purchase_id, installation_id, manufacturing_date, warranty_expiry, purchase_price, remarks, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.product_id,
        data.serial_number,
        data.warehouse_id || null,
        data.current_location,
        data.project_id || null,
        data.purchase_id || null,
        data.installation_id || null,
        data.manufacturing_date || null,
        data.warranty_expiry || null,
        data.purchase_price || null,
        data.remarks || null,
        data.status,
      ]
    );
  },

  // Bulk create serial numbers
  bulkCreate: async (items: Array<{
    product_id: number;
    serial_number: string;
    warehouse_id?: number;
    manufacturing_date?: Date;
    purchase_price?: number;
  }>): Promise<number[]> => {
    return transaction(async (conn) => {
      const ids: number[] = [];

      for (const item of items) {
        const [result] = await conn.execute(
          `INSERT INTO product_serial_numbers (product_id, serial_number, warehouse_id, current_location,
           manufacturing_date, purchase_price, status)
           VALUES (?, ?, ?, 'WAREHOUSE', ?, ?, 'AVAILABLE')`,
          [item.product_id, item.serial_number, item.warehouse_id || null, item.manufacturing_date || null, item.purchase_price || null]
        );
        ids.push((result as any).insertId);
      }

      return ids;
    });
  },

  // Import Flasher Test Report (FTR) to update solar panel stock and serial numbers
  importFlasherReport: async (data: {
    product_id: number;
    invoice_no?: string;
    warehouse_id?: number;
    modules: Array<{
      module_sr_no: string;
      box_no?: string;
      pmax?: string | number;
      voc?: string | number;
      isc?: string | number;
      vmp?: string | number;
      imp?: string | number;
      ff?: string | number;
      eff?: string | number;
    }>;
    userId: number;
  }): Promise<{ importedCount: number; newlyInsertedCount: number; newStockCount: number }> => {
    return transaction(async (conn) => {
      let importedCount = 0;
      let newlyInsertedCount = 0;

      // Process module serial numbers in chunked batches of 100
      const CHUNK_SIZE = 100;
      for (let i = 0; i < data.modules.length; i += CHUNK_SIZE) {
        const chunk = data.modules.slice(i, i + CHUNK_SIZE);
        for (const mod of chunk) {
          if (!mod.module_sr_no) continue;
          const remarks = `Box: ${mod.box_no || 'N/A'} | Pmax: ${mod.pmax || ''}W | Voc: ${mod.voc || ''}V | Isc: ${mod.isc || ''}A | Eff: ${mod.eff || ''}%`;
          
          const [result] = await conn.execute(
            `INSERT INTO product_serial_numbers (product_id, serial_number, warehouse_id, current_location, remarks, status)
             VALUES (?, ?, ?, 'WAREHOUSE', ?, 'AVAILABLE')
             ON DUPLICATE KEY UPDATE remarks = VALUES(remarks)`,
            [data.product_id, mod.module_sr_no, data.warehouse_id || null, remarks]
          );

          importedCount++;
          if ((result as any).affectedRows === 1) {
            newlyInsertedCount++;
          }

          // Try to set invoice_no (column added via auto-migration — may not exist on old installs)
          if (data.invoice_no) {
            try {
              await conn.execute(
                `UPDATE product_serial_numbers SET invoice_no = ? WHERE serial_number = ?`,
                [data.invoice_no, mod.module_sr_no]
              );
            } catch (_invErr) {
              // Column doesn't exist yet — will work after first migration
            }
          }
        }
      }


      // Only increment current_stock for newly added unique serial numbers
      if (newlyInsertedCount > 0) {
        await conn.execute(
          'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
          [newlyInsertedCount, data.product_id]
        );
      }

      // Add stock transaction ledger entry safely
      try {
        await conn.execute(
          `INSERT INTO stock_transactions (product_id, type, quantity, reference_type, remarks, created_by)
           VALUES (?, 'PURCHASE', ?, 'FTR_IMPORT', ?, ?)`,
          [data.product_id, newlyInsertedCount > 0 ? newlyInsertedCount : importedCount, `FTR Import Invoice #${data.invoice_no || 'N/A'} - ${importedCount} panels (${newlyInsertedCount} new)`, data.userId]
        );
      } catch (stErr) {
        console.warn('stock_transactions ledger entry optional error:', stErr);
      }

      // Get updated current_stock
      const [rows] = await conn.execute('SELECT current_stock FROM products WHERE id = ?', [data.product_id]);
      const newStockCount = (rows as any)?.[0]?.current_stock || 0;


      return { importedCount, newlyInsertedCount, newStockCount };
    });
  },



  update: async (id: number, data: Partial<Omit<ProductSerialNumber, 'id' | 'created_at' | 'updated_at' | 'product' | 'warehouse'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.serial_number) {
      fields.push('serial_number = ?');
      values.push(data.serial_number);
    }
    if (data.warehouse_id !== undefined) {
      fields.push('warehouse_id = ?');
      values.push(data.warehouse_id);
    }
    if (data.current_location) {
      fields.push('current_location = ?');
      values.push(data.current_location);
    }
    if (data.project_id !== undefined) {
      fields.push('project_id = ?');
      values.push(data.project_id);
    }
    if (data.purchase_id !== undefined) {
      fields.push('purchase_id = ?');
      values.push(data.purchase_id);
    }
    if (data.installation_id !== undefined) {
      fields.push('installation_id = ?');
      values.push(data.installation_id);
    }
    if (data.manufacturing_date !== undefined) {
      fields.push('manufacturing_date = ?');
      values.push(data.manufacturing_date);
    }
    if (data.warranty_expiry !== undefined) {
      fields.push('warranty_expiry = ?');
      values.push(data.warranty_expiry);
    }
    if (data.purchase_price !== undefined) {
      fields.push('purchase_price = ?');
      values.push(data.purchase_price);
    }
    if (data.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(data.remarks);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(`UPDATE product_serial_numbers SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  // Reserve serial numbers for a project
  reserveForProject: async (serialIds: number[], projectId: number): Promise<number> => {
    return transaction(async (conn) => {
      let affectedRows = 0;

      for (const serialId of serialIds) {
        const [result] = await conn.execute(
          `UPDATE product_serial_numbers
           SET current_location = 'RESERVED', project_id = ?, status = 'RESERVED'
           WHERE id = ? AND status = 'AVAILABLE'`,
          [projectId, serialId]
        );
        affectedRows += (result as any).affectedRows;
      }

      return affectedRows;
    });
  },

  // Issue serial numbers to project
  issueToProject: async (serialIds: number[]): Promise<number> => {
    return transaction(async (conn) => {
      let affectedRows = 0;

      for (const serialId of serialIds) {
        const [result] = await conn.execute(
          `UPDATE product_serial_numbers
           SET current_location = 'ISSUED', status = 'ISSUED'
           WHERE id = ? AND current_location IN ('RESERVED', 'WAREHOUSE')`,
          [serialId]
        );
        affectedRows += (result as any).affectedRows;
      }

      return affectedRows;
    });
  },

  // Mark as installed
  markInstalled: async (serialIds: number[], installationId: number): Promise<number> => {
    return transaction(async (conn) => {
      let affectedRows = 0;

      for (const serialId of serialIds) {
        const [result] = await conn.execute(
          `UPDATE product_serial_numbers
           SET current_location = 'INSTALLED', installation_id = ?, status = 'INSTALLED'
           WHERE id = ? AND current_location = 'ISSUED'`,
          [installationId, serialId]
        );
        affectedRows += (result as any).affectedRows;
      }

      return affectedRows;
    });
  },

  // Return to warehouse
  returnToWarehouse: async (serialIds: number[], warehouseId: number, reason?: string): Promise<number> => {
    return transaction(async (conn) => {
      let affectedRows = 0;

      for (const serialId of serialIds) {
        const [result] = await conn.execute(
          `UPDATE product_serial_numbers
           SET current_location = 'WAREHOUSE', warehouse_id = ?, project_id = NULL, installation_id = NULL,
           status = 'AVAILABLE', remarks = CONCAT(COALESCE(remarks, ''), 'Returned: ', ?)
           WHERE id = ?`,
          [warehouseId, reason || 'No reason', serialId]
        );
        affectedRows += (result as any).affectedRows;
      }

      return affectedRows;
    });
  },

  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM product_serial_numbers WHERE id = ?', [id]);
  },

  // Get serial number tracking history
  getTrackingInfo: async (serialNumber: string): Promise<{
    serial: ProductSerialNumber | null;
    project: any;
    installation: any;
    warranty: any;
  } | null> => {
    const serial = await serialNumberDb.findBySerialNumber(serialNumber);
    if (!serial) return null;

    let project = null;
    let installation = null;
    let warranty = null;

    if (serial.project_id) {
      project = await queryOne(
        `SELECT p.*, c.name as customer_name, c.mobile as customer_mobile
         FROM projects p
         LEFT JOIN customers c ON p.customer_id = c.id
         WHERE p.id = ?`,
        [serial.project_id]
      );
    }

    if (serial.installation_id) {
      installation = await queryOne(
        'SELECT * FROM installations WHERE id = ?',
        [serial.installation_id]
      );
    }

    // Check warranty status
    if (serial.warranty_expiry) {
      const now = new Date();
      const expiry = new Date(serial.warranty_expiry);
      warranty = {
        valid: expiry > now,
        expiry_date: serial.warranty_expiry,
        days_remaining: Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      };
    }

    return { serial, project, installation, warranty };
  },
};
