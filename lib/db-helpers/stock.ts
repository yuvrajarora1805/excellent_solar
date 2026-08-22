import { query, queryOne, insert, execute, transaction } from '@/lib/db';
import type { StockTransaction, StockTransactionType } from '@/types';

export const stockDb = {
  // Get stock ledger for a product
  getProductLedger: async (productId: number): Promise<StockTransaction[]> => {
    return query<StockTransaction>(
      `SELECT st.*, u.name as created_by_name, p.name as product_name, p.product_code
       FROM stock_transactions st
       LEFT JOIN users u ON st.created_by = u.id
       LEFT JOIN products p ON st.product_id = p.id
       WHERE st.product_id = ?
       ORDER BY st.created_at ASC`,
      [productId]
    );
  },

  // Get all stock transactions
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    productId?: number;
    type?: StockTransactionType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<StockTransaction[]> => {
    let sql = `SELECT st.*, u.name as created_by_name, p.name as product_name, p.product_code
               FROM stock_transactions st
               LEFT JOIN users u ON st.created_by = u.id
               LEFT JOIN products p ON st.product_id = p.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.productId) {
      conditions.push('st.product_id = ?');
      params.push(options.productId);
    }
    if (options?.type) {
      conditions.push('st.type = ?');
      params.push(options.type);
    }
    if (options?.startDate) {
      conditions.push('st.created_at >= ?');
      params.push(options.startDate);
    }
    if (options?.endDate) {
      conditions.push('st.created_at <= ?');
      params.push(options.endDate);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY st.created_at DESC';

    if (options?.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    return query<StockTransaction>(sql, params);
  },

  // Create stock transaction
  create: async (data: Omit<StockTransaction, 'id' | 'created_at'>): Promise<number> => {
    return insert(
      'INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.product_id, data.type, data.quantity, data.reference_id || null, data.reference_type || null, data.remarks || null, data.created_by]
    );
  },

  // Create stock transaction and update product stock
  createWithStockUpdate: async (
    data: Omit<StockTransaction, 'id' | 'created_at'>
  ): Promise<void> => {
    transaction(async (conn) => {
      // Create transaction record
      await conn.execute(
        `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, remarks, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.product_id, data.type, data.quantity, data.reference_id || null, data.reference_type || null, data.remarks || null, data.created_by]
      );

      // Update product stock based on transaction type
      const stockChange = data.type === 'PURCHASE' || data.type === 'RETURN' ? data.quantity : -data.quantity;
      await conn.execute(
        'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
        [stockChange, data.product_id]
      );
    });
  },

  // Stock adjustment
  adjustStock: async (
    productId: number,
    newQuantity: number,
    reason: string,
    userId: number
  ): Promise<void> => {
    transaction(async (conn) => {
      // Get current stock
      const product = await queryOne<{ current_stock: number }>('SELECT current_stock FROM products WHERE id = ?', [productId]);
      if (!product) throw new Error('Product not found');

      // Create adjustment record
      await conn.execute(
        'INSERT INTO stock_adjustments (product_id, old_quantity, new_quantity, reason, created_by) VALUES (?, ?, ?, ?, ?)',
        [productId, product.current_stock, newQuantity, reason, userId]
      );

      // Create stock transaction
      const difference = newQuantity - product.current_stock;
      const type = difference > 0 ? 'ADJUSTMENT' : 'ADJUSTMENT';
      await conn.execute(
        `INSERT INTO stock_transactions (product_id, type, quantity, remarks, created_by)
         VALUES (?, ?, ?, ?, ?)`,
        [productId, type, Math.abs(difference), `Stock adjustment: ${reason}`, userId]
      );

      // Update product stock
      await conn.execute(
        'UPDATE products SET current_stock = ? WHERE id = ?',
        [newQuantity, productId]
      );
    });
  },

  // Issue material to project
  issueToProject: async (
    items: { product_id: number; quantity: number }[],
    projectId: number,
    userId: number
  ): Promise<number> => {
    return transaction(async (conn) => {
      // Create material issue record
      const [result] = await conn.execute(
        'INSERT INTO material_issues (project_id, issue_date, created_by) VALUES (?, CURDATE(), ?)',
        [projectId, userId]
      );
      const issueId = (result as any).insertId;

      // Issue each item
      for (const item of items) {
        // Check stock availability
        const product = await queryOne<{ current_stock: number }>('SELECT current_stock FROM products WHERE id = ?', [item.product_id]);
        if (!product || product.current_stock < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.product_id}`);
        }

        // Create material issue item
        await conn.execute(
          'INSERT INTO material_issue_items (material_issue_id, product_id, quantity) VALUES (?, ?, ?)',
          [issueId, item.product_id, item.quantity]
        );

        // Create stock transaction
        await conn.execute(
          `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, created_by)
           VALUES (?, 'ISSUE', ?, ?, 'MATERIAL_ISSUE', ?)`,
          [item.product_id, item.quantity, issueId, userId]
        );

        // Update product stock
        await conn.execute(
          'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      return issueId;
    });
  },

  // Return material from project
  returnFromProject: async (
    items: { product_id: number; quantity: number }[],
    projectId: number,
    userId: number
  ): Promise<number> => {
    return transaction(async (conn) => {
      // Create material issue record (as return)
      const [result] = await conn.execute(
        'INSERT INTO material_issues (project_id, issue_date, created_by) VALUES (?, CURDATE(), ?)',
        [projectId, userId]
      );
      const issueId = (result as any).insertId;

      // Return each item
      for (const item of items) {
        // Create material issue item
        await conn.execute(
          'INSERT INTO material_issue_items (material_issue_id, product_id, quantity) VALUES (?, ?, ?)',
          [issueId, item.product_id, item.quantity]
        );

        // Create stock transaction (RETURN type)
        await conn.execute(
          `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, created_by)
           VALUES (?, 'RETURN', ?, ?, 'MATERIAL_ISSUE', ?)`,
          [item.product_id, item.quantity, issueId, userId]
        );

        // Update product stock (increase for returns)
        await conn.execute(
          'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      return issueId;
    });
  },

  // Get material issues for a project
  getProjectMaterialIssues: async (projectId: number): Promise<any[]> => {
    return query(
      `SELECT mi.*, mi.id as issue_id,
        GROUP_CONCAT(CONCAT(p.name, ' (', mii.quantity, ' ', p.unit, ')') SEPARATOR ', ') as items_summary
       FROM material_issues mi
       LEFT JOIN material_issue_items mii ON mi.id = mii.material_issue_id
       LEFT JOIN products p ON mii.product_id = p.id
       WHERE mi.project_id = ?
       GROUP BY mi.id
       ORDER BY mi.issue_date DESC`,
      [projectId]
    );
  },

  // Get stock summary report
  getStockSummary: async (options?: { category?: string }): Promise<any[]> => {
    let sql = `SELECT p.*, c.name as category_name
               FROM products p
               LEFT JOIN product_categories c ON p.category = c.name
               WHERE p.status = 'Active'`;
    const params: any[] = [];

    if (options?.category) {
      sql += ' AND p.category = ?';
      params.push(options.category);
    }

    sql += ' ORDER BY p.category, p.name';

    return query(sql, params);
  },
};
