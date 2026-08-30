import { query, queryOne, insert, execute, transaction } from '@/lib/db';
import type { Quotation, QuotationItem, QuotationStatus } from '@/types';

export const quotationDb = {
  // Find all quotations
  findAll: async (options?: {
    project_id?: number;
    status?: QuotationStatus;
    limit?: number;
    offset?: number;
  }): Promise<Quotation[]> => {
    try {
      let sql = `
        SELECT q.*, p.project_id, c.name as customer_name,
               u.name as created_by_name
        FROM quotations q
        LEFT JOIN projects p ON q.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        LEFT JOIN users u ON q.created_by = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (options?.project_id) {
        sql += ' AND q.project_id = ?';
        params.push(options.project_id);
      }
      if (options?.status) {
        sql += ' AND q.status = ?';
        params.push(options.status);
      }

      sql += ' ORDER BY q.quotation_date DESC, q.created_at DESC';

      if (options?.limit) {
        sql += ` LIMIT ${Number(options.limit)}`;
        if (options.offset) {
          sql += ` OFFSET ${Number(options.offset)}`;
        }
      }

      return await query<Quotation>(sql, params);
    } catch (e) {
      console.warn('quotationDb.findAll query warning:', e);
      // Fallback simple query if complex joins fail
      try {
        return await query<Quotation>('SELECT * FROM quotations ORDER BY id DESC');
      } catch (err) {
        return [];
      }
    }
  },

  // Find by ID with items
  findById: async (id: number): Promise<Quotation | null> => {
    const quotation = await queryOne<any>(
      `SELECT q.*, p.project_id, p.latitude as project_latitude, p.longitude as project_longitude, c.name as customer_name,
              u.name as created_by_name, st.name as template_name
       FROM quotations q
       LEFT JOIN projects p ON q.project_id = p.id
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN system_templates st ON q.system_template_id = st.id
       WHERE q.id = ?`,
      [id]
    );

    if (!quotation) return null;

    // Get items
    const items = await query<any>(
      `SELECT qi.*, p.name as product_name, p.product_code
       FROM quotation_items qi
       LEFT JOIN products p ON qi.product_id = p.id
       WHERE qi.quotation_id = ?
       ORDER BY qi.sort_order ASC`,
      [id]
    );

    return {
      ...quotation,
      items: items.map(i => ({
        ...i,
        product: i.product_id ? { id: i.product_id, name: i.product_name, product_code: i.product_code } : undefined,
      })),
    };
  },

  // Find by quotation number
  findByNumber: async (quotationNumber: string): Promise<Quotation | null> => {
    return queryOne<Quotation>('SELECT * FROM quotations WHERE quotation_number = ?', [quotationNumber]);
  },

  // Generate quotation number
  generateNumber: async (): Promise<string> => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const count = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM quotations WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
      [year, new Date().getMonth() + 1]
    );
    const seq = (count?.count || 0) + 1;
    return `QT-${year}${month}-${seq.toString().padStart(4, '0')}`;
  },

  // Create quotation from system template
  createFromTemplate: async (data: {
    project_id: number;
    system_template_id: number;
    quotation_date: Date;
    valid_until?: Date;
    discount_percentage?: number;
    terms_conditions?: string;
    remarks?: string;
  }, userId: number): Promise<number> => {
    return transaction(async (conn) => {
      // Get template with items
      const template = await queryOne<any>(
        `SELECT st.*, p.name as product_name, p.product_code, p.selling_price as unit_price
         FROM system_templates st
         LEFT JOIN system_template_items sti ON st.id = sti.system_template_id
         LEFT JOIN products p ON sti.product_id = p.id
         WHERE st.id = ?`,
        [data.system_template_id]
      );

      if (!template) throw new Error('Template not found');

      const quotationNumber = await quotationDb.generateNumber();
      const discountPercentage = data.discount_percentage || 0;

      // Calculate totals
      let subtotal = 0;
      const items: any[] = [];

      // Get all template items
      const templateItems = await query<any>(
        `SELECT sti.*, p.name as product_name, p.product_code, p.selling_price as unit_price
         FROM system_template_items sti
         LEFT JOIN products p ON sti.product_id = p.id
         WHERE sti.system_template_id = ? AND sti.is_optional = 0
         ORDER BY sti.sort_order ASC`,
        [data.system_template_id]
      );

      for (const item of templateItems) {
        const lineTotal = item.quantity * (item.unit_price || 0);
        subtotal += lineTotal;
        items.push({
          product_id: item.product_id,
          description: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price || 0,
          discount_amount: 0,
          tax_amount: 0,
          line_total: lineTotal,
          sort_order: item.sort_order,
        });
      }

      const discountAmount = subtotal * (discountPercentage / 100);
      const afterDiscount = subtotal - discountAmount;
      const gstAmount = afterDiscount * 0.18; // 18% GST
      const totalAmount = afterDiscount + gstAmount;

      // Ensure missing columns exist in DB table
      try { await conn.execute(`ALTER TABLE quotations ADD COLUMN customer_id INT NULL`); } catch {}
      try { await conn.execute(`ALTER TABLE quotations ADD COLUMN rate_per_watt VARCHAR(50) NULL`); } catch {}

      const [projResult] = await conn.execute('SELECT customer_id FROM projects WHERE id = ?', [data.project_id]);
      const customerId = (projResult as any[])[0]?.customer_id || null;

      // Insert quotation
      const [result] = await conn.execute(
        `INSERT INTO quotations (quotation_number, project_id, customer_id, quotation_date, valid_until, system_type, capacity_kw,
         system_template_id, subtotal, discount_amount, discount_percentage, gst_amount, gst_percentage, total_amount,
         status, terms_conditions, remarks, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quotationNumber,
          data.project_id,
          customerId,
          data.quotation_date,
          data.valid_until || null,
          template.system_type,
          template.capacity_kw,
          data.system_template_id,
          subtotal,
          discountAmount,
          discountPercentage,
          gstAmount,
          18,
          totalAmount,
          'DRAFT',
          data.terms_conditions || null,
          data.remarks || null,
          userId,
        ]
      );
      const quotationId = (result as any).insertId;

      // Insert items
      for (const item of items) {
        await conn.execute(
          `INSERT INTO quotation_items (quotation_id, product_id, description, quantity, unit, unit_price,
           discount_amount, tax_amount, line_total, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [quotationId, item.product_id, item.description, item.quantity, item.unit, item.unit_price,
           item.discount_amount, item.tax_amount, item.line_total, item.sort_order]
        );
      }

      return quotationId;
    });
  },

  // Create custom quotation
  create: async (data: Omit<Quotation, 'id' | 'quotation_number' | 'created_at' | 'updated_at' | 'created_by_user'> & { items: Array<Omit<QuotationItem, 'id' | 'quotation_id' | 'created_at'>> }, userId: number): Promise<number> => {
    return transaction(async (conn) => {
      // Ensure missing or restricted columns exist and support flexible string formats in DB table
      try { await conn.execute(`ALTER TABLE quotations ADD COLUMN customer_id INT NULL`); } catch {}
      try { await conn.execute(`ALTER TABLE quotations ADD COLUMN rate_per_watt VARCHAR(50) NULL`); } catch {}
      try { await conn.execute(`ALTER TABLE quotations MODIFY COLUMN system_type VARCHAR(255) NULL`); } catch {}
      try { await conn.execute(`ALTER TABLE quotations MODIFY COLUMN capacity_kw VARCHAR(50) NULL`); } catch {}
      try { await conn.execute(`ALTER TABLE quotations MODIFY COLUMN status VARCHAR(50) DEFAULT 'DRAFT'`); } catch {}
      try { await conn.execute(`ALTER TABLE quotation_items MODIFY COLUMN quantity VARCHAR(50) NULL`); } catch {}
      try { await conn.execute(`ALTER TABLE quotation_items MODIFY COLUMN unit VARCHAR(255) NULL`); } catch {}
      try { await conn.execute(`ALTER TABLE quotation_items ADD COLUMN brand VARCHAR(100) NULL`); } catch {}

      const quotationNumber = await quotationDb.generateNumber();

      // Calculate totals from items or use provided total amount
      const subtotal = data.subtotal !== undefined ? Number(data.subtotal) : data.items.reduce((sum, item) => sum + (item.line_total || 0), 0);
      const discountAmount = data.discount_amount !== undefined ? Number(data.discount_amount) : (subtotal * ((data.discount_percentage || 0) / 100));
      const afterDiscount = subtotal - discountAmount;
      const gstAmount = data.gst_amount !== undefined ? Number(data.gst_amount) : (afterDiscount * ((data.gst_percentage || 8.9) / 100));
      const totalAmount = data.total_amount !== undefined ? Number(data.total_amount) : (afterDiscount + gstAmount);

      const [projResult] = await conn.execute('SELECT customer_id FROM projects WHERE id = ?', [data.project_id]);
      const customerId = (projResult as any[])[0]?.customer_id || null;

      const ratePerWatt = (data as any).rate_per_watt ? String((data as any).rate_per_watt) : null;

      // Insert quotation
      const [result] = await conn.execute(
        `INSERT INTO quotations (quotation_number, project_id, customer_id, quotation_date, valid_until, system_type, capacity_kw,
         system_template_id, subtotal, discount_amount, discount_percentage, gst_amount, gst_percentage, total_amount, rate_per_watt,
         payment_schedule, status, terms_conditions, remarks, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quotationNumber,
          data.project_id,
          customerId,
          data.quotation_date,
          data.valid_until || null,
          data.system_type || null,
          data.capacity_kw || null,
          data.system_template_id || null,
          subtotal,
          discountAmount,
          data.discount_percentage || 0,
          gstAmount,
          data.gst_percentage || 8.9,
          totalAmount,
          ratePerWatt,
          data.payment_schedule ? JSON.stringify(data.payment_schedule) : null,
          data.status || 'DRAFT',
          data.terms_conditions || null,
          data.remarks || null,
          userId,
        ]
      );
      const quotationId = (result as any).insertId;

      // Insert items
      for (const item of data.items) {
        await conn.execute(
          `INSERT INTO quotation_items (quotation_id, product_id, description, quantity, brand, unit, unit_price,
           discount_amount, tax_amount, line_total, sort_order, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quotationId,
            (item as any).product_id || null,
            item.description || '',
            String(item.quantity ?? '0'),
            (item as any).brand || null,
            item.unit || null,
            Number(item.unit_price || 0),
            Number(item.discount_amount || 0),
            Number(item.tax_amount || 0),
            Number(item.line_total || 0),
            item.sort_order || 0,
            (item as any).remarks || null,
          ]
        );
      }

      return quotationId;
    });
  },

  // Update quotation
  update: async (id: number, data: any): Promise<number> => {
    return transaction(async (conn) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.quotation_date) {
        fields.push('quotation_date = ?');
        values.push(data.quotation_date);
      }
      if (data.valid_until !== undefined) {
        fields.push('valid_until = ?');
        values.push(data.valid_until);
      }
      if (data.system_type) {
        fields.push('system_type = ?');
        values.push(data.system_type);
      }
      if (data.capacity_kw !== undefined) {
        fields.push('capacity_kw = ?');
        values.push(data.capacity_kw);
      }
      if (data.subtotal !== undefined) {
        fields.push('subtotal = ?');
        values.push(data.subtotal);
      }
      if (data.discount_amount !== undefined) {
        fields.push('discount_amount = ?');
        values.push(data.discount_amount);
      }
      if (data.discount_percentage !== undefined) {
        fields.push('discount_percentage = ?');
        values.push(data.discount_percentage);
      }
      if (data.gst_amount !== undefined) {
        fields.push('gst_amount = ?');
        values.push(data.gst_amount);
      }
      if (data.gst_percentage !== undefined) {
        fields.push('gst_percentage = ?');
        values.push(data.gst_percentage);
      }
      if (data.total_amount !== undefined) {
        fields.push('total_amount = ?');
        values.push(data.total_amount);
      }
      if (data.payment_schedule !== undefined) {
        fields.push('payment_schedule = ?');
        values.push(JSON.stringify(data.payment_schedule));
      }
      if (data.status) {
        fields.push('status = ?');
        values.push(data.status);
      }
      if (data.terms_conditions !== undefined) {
        fields.push('terms_conditions = ?');
        values.push(data.terms_conditions);
      }
      if (data.remarks !== undefined) {
        fields.push('remarks = ?');
        values.push(data.remarks);
      }

      if (fields.length > 0) {
        values.push(id);
        await conn.execute(
          `UPDATE quotations SET ${fields.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update items if provided
      if (data.items && Array.isArray(data.items)) {
        await conn.execute('DELETE FROM quotation_items WHERE quotation_id = ?', [id]);
        for (const item of data.items) {
          await conn.execute(
            `INSERT INTO quotation_items (quotation_id, product_id, description, quantity, unit, unit_price,
             discount_amount, tax_amount, line_total, sort_order, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              item.product_id || null,
              item.description || item.product?.name || item.material || '',
              item.quantity || 1,
              item.unit || null,
              Number(item.unit_price || 0),
              Number(item.discount_amount || 0),
              Number(item.tax_amount || 0),
              Number(item.line_total || 0),
              item.sort_order || 0,
              item.remarks || null,
            ]
          );
        }
      }

      return id;
    });
  },

  // Update status
  updateStatus: async (id: number, status: QuotationStatus, rejectionReason?: string): Promise<number> => {
    const fields: string[] = ['status = ?'];
    const values: any[] = [status];

    if (status === 'SENT') {
      fields.push('sent_at = CURRENT_TIMESTAMP');
    } else if (status === 'ACCEPTED') {
      fields.push('accepted_at = CURRENT_TIMESTAMP');
    } else if (status === 'REJECTED' && rejectionReason) {
      fields.push('rejected_at = CURRENT_TIMESTAMP');
      fields.push('rejection_reason = ?');
      values.push(rejectionReason);
    }

    values.push(id);
    return execute(
      `UPDATE quotations SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete quotation
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM quotations WHERE id = ?', [id]);
  },
};
