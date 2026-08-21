import { query, queryOne, insert, execute, transaction } from '@/lib/db';

export interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  invoice_date: Date;
  total_amount?: number;
  remarks?: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  supplier_name?: string;
  created_by_name?: string;
}

export interface PurchaseItem {
  id: number;
  purchase_invoice_id: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks?: string;
}

export const purchaseDb = {
  // Find invoice by ID
  findById: async (id: number): Promise<(PurchaseInvoice & { items: PurchaseItem[] }) | null> => {
    const invoice = await queryOne<PurchaseInvoice>(
      `SELECT pi.*, s.name as supplier_name, u.name as created_by_name
       FROM purchase_invoices pi
       LEFT JOIN suppliers s ON pi.supplier_id = s.id
       LEFT JOIN users u ON pi.created_by = u.id
       WHERE pi.id = ?`,
      [id]
    );

    if (!invoice) return null;

    const items = await query<PurchaseItem>(
      `SELECT pi.*, p.name as product_name, p.product_code
       FROM purchase_items pi
       LEFT JOIN products p ON pi.product_id = p.id
       WHERE pi.purchase_invoice_id = ?`,
      [id]
    );

    return { ...invoice, items };
  },

  // Get all invoices
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    supplierId?: number;
    search?: string;
  }): Promise<PurchaseInvoice[]> => {
    let sql = `SELECT pi.*, s.name as supplier_name, u.name as created_by_name
               FROM purchase_invoices pi
               LEFT JOIN suppliers s ON pi.supplier_id = s.id
               LEFT JOIN users u ON pi.created_by = u.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.supplierId) {
      conditions.push('pi.supplier_id = ?');
      params.push(options.supplierId);
    }
    if (options?.search) {
      conditions.push('(pi.invoice_number LIKE ? OR s.name LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY pi.invoice_date DESC, pi.created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return query<PurchaseInvoice>(sql, params);
  },

  // Count invoices
  count: async (options?: { supplierId?: number; search?: string }): Promise<number> => {
    let sql = `SELECT COUNT(*) as count FROM purchase_invoices pi
               LEFT JOIN suppliers s ON pi.supplier_id = s.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.supplierId) {
      conditions.push('pi.supplier_id = ?');
      params.push(options.supplierId);
    }
    if (options?.search) {
      conditions.push('(pi.invoice_number LIKE ? OR s.name LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  },

  // Create purchase invoice with items (transaction)
  createWithItems: async (
    data: Omit<PurchaseInvoice, 'id' | 'created_at' | 'updated_at' | 'supplier_name' | 'created_by_name'>,
    items: Omit<PurchaseItem, 'id' | 'purchase_invoice_id' | 'product_name' | 'product_code'>[],
    userId: number
  ): Promise<number> => {
    return transaction(async (conn) => {
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

      // Insert invoice
      const [result] = await conn.execute(
        `INSERT INTO purchase_invoices (invoice_number, supplier_id, invoice_date, total_amount, remarks, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.invoice_number, data.supplier_id, data.invoice_date, totalAmount, data.remarks || null, data.created_by]
      );
      const insertId = (result as any).insertId;

      // Insert items
      for (const item of items) {
        await conn.execute(
          `INSERT INTO purchase_items (purchase_invoice_id, product_id, quantity, rate, amount, remarks)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [insertId, item.product_id, item.quantity, item.rate, item.amount, item.remarks || null]
        );

        // Update product stock
        await conn.execute(
          'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Create stock transaction
        await conn.execute(
          `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, created_by)
           VALUES (?, 'PURCHASE', ?, ?, 'PURCHASE_INVOICE', ?)`,
          [item.product_id, item.quantity, insertId, userId]
        );
      }

      return insertId;
    });
  },

  // Update invoice
  update: async (id: number, data: Partial<Omit<PurchaseInvoice, 'id' | 'created_at' | 'updated_at' | 'supplier_name' | 'created_by_name'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.invoice_number) {
      fields.push('invoice_number = ?');
      values.push(data.invoice_number);
    }
    if (data.supplier_id) {
      fields.push('supplier_id = ?');
      values.push(data.supplier_id);
    }
    if (data.invoice_date) {
      fields.push('invoice_date = ?');
      values.push(data.invoice_date);
    }
    if (data.total_amount !== undefined) {
      fields.push('total_amount = ?');
      values.push(data.total_amount);
    }
    if (data.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(data.remarks || null);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE purchase_invoices SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete invoice (with stock reversal)
  delete: async (id: number, userId: number): Promise<number> => {
    return transaction(async (conn) => {
      // Get items to reverse stock
      const items = await query<PurchaseItem>(
        'SELECT product_id, quantity FROM purchase_items WHERE purchase_invoice_id = ?',
        [id]
      );

      // Reverse stock for each item
      for (const item of items) {
        await conn.execute(
          'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Create return transaction
        await conn.execute(
          `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, created_by)
           VALUES (?, 'RETURN', ?, ?, 'PURCHASE_INVOICE', ?)`,
          [item.product_id, item.quantity, id, userId]
        );
      }

      // Delete items
      await conn.execute('DELETE FROM purchase_items WHERE purchase_invoice_id = ?', [id]);

      // Delete invoice
      const [result] = await conn.execute('DELETE FROM purchase_invoices WHERE id = ?', [id]);
      return (result as any).affectedRows;
    });
  },
};

// Suppliers
export const supplierDb = {
  findAll: async (): Promise<any[]> => {
    return query('SELECT * FROM suppliers ORDER BY name ASC');
  },

  findById: async (id: number): Promise<any | null> => {
    return queryOne('SELECT * FROM suppliers WHERE id = ?', [id]);
  },

  create: async (data: any): Promise<number> => {
    return insert(
      'INSERT INTO suppliers (name, contact_person, mobile, email, address, city, state, gstin, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.contact_person || null, data.mobile || null, data.email || null, data.address || null, data.city || null, data.state || null, data.gstin || null, 'Active']
    );
  },

  update: async (id: number, data: any): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.contact_person !== undefined) {
      fields.push('contact_person = ?');
      values.push(data.contact_person || null);
    }
    if (data.mobile !== undefined) {
      fields.push('mobile = ?');
      values.push(data.mobile || null);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email || null);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address || null);
    }
    if (data.city !== undefined) {
      fields.push('city = ?');
      values.push(data.city || null);
    }
    if (data.state !== undefined) {
      fields.push('state = ?');
      values.push(data.state || null);
    }
    if (data.gstin !== undefined) {
      fields.push('gstin = ?');
      values.push(data.gstin || null);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: async (id: number): Promise<number> => {
    // Check if supplier has purchases
    const purchases = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM purchase_invoices WHERE supplier_id = ?', [id]);
    if (purchases && purchases.count > 0) {
      throw new Error('Cannot delete supplier with existing purchases');
    }
    return execute('DELETE FROM suppliers WHERE id = ?', [id]);
  },
};
