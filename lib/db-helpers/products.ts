import { query, queryOne, insert, execute } from '@/lib/db';
import type { Product } from '@/types';

export const productDb = {
  // Find product by ID
  findById: async (id: number): Promise<Product | null> => {
    return queryOne<Product>('SELECT * FROM products WHERE id = ?', [id]);
  },

  // Find product by code
  findByCode: async (productCode: string): Promise<Product | null> => {
    return queryOne<Product>('SELECT * FROM products WHERE product_code = ?', [productCode]);
  },

  // Get all products
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    category?: string;
    search?: string;
    lowStock?: boolean;
  }): Promise<Product[]> => {
    let sql = 'SELECT * FROM products';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }
    if (options?.search) {
      conditions.push('(name LIKE ? OR product_code LIKE ? OR brand LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (options?.lowStock) {
      conditions.push('current_stock <= minimum_stock');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY name ASC';

    if (options?.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    return query<Product>(sql, params);
  },

  // Count products
  count: async (options?: {
    category?: string;
    search?: string;
    lowStock?: boolean;
  }): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM products';
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.category) {
      conditions.push('category = ?');
      params.push(options.category);
    }
    if (options?.search) {
      conditions.push('(name LIKE ? OR product_code LIKE ? OR brand LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (options?.lowStock) {
      conditions.push('current_stock <= minimum_stock');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  },

  // Create new product
  create: async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    return insert(
      'INSERT INTO products (product_code, name, category, brand, model, specification, unit, minimum_stock, current_stock, selling_price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        data.product_code,
        data.name,
        data.category,
        data.brand || null,
        data.model || null,
        data.specification || null,
        data.unit,
        data.minimum_stock,
        data.current_stock,
        data.selling_price || 0,
        data.status || 'ACTIVE'
      ]
    );
  },

  // Update product
  update: async (id: number, data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.product_code) {
      fields.push('product_code = ?');
      values.push(data.product_code);
    }
    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.category) {
      fields.push('category = ?');
      values.push(data.category);
    }
    if (data.brand !== undefined) {
      fields.push('brand = ?');
      values.push(data.brand || null);
    }
    if (data.model !== undefined) {
      fields.push('model = ?');
      values.push(data.model || null);
    }
    if (data.specification !== undefined) {
      fields.push('specification = ?');
      values.push(data.specification || null);
    }
    if (data.unit) {
      fields.push('unit = ?');
      values.push(data.unit);
    }
    if (data.minimum_stock !== undefined) {
      fields.push('minimum_stock = ?');
      values.push(data.minimum_stock);
    }
    if (data.current_stock !== undefined) {
      fields.push('current_stock = ?');
      values.push(data.current_stock);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.selling_price !== undefined) {
      fields.push('selling_price = ?');
      values.push(data.selling_price);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Update stock (direct update, use with caution)
  updateStock: async (id: number, quantity: number): Promise<number> => {
    return execute('UPDATE products SET current_stock = ? WHERE id = ?', [quantity, id]);
  },

  // Delete product
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM products WHERE id = ?', [id]);
  },

  // Get distinct categories
  getCategories: async (): Promise<string[]> => {
    const rows = await query<{ category: string }>('SELECT DISTINCT category FROM products WHERE status = "Active" ORDER BY category');
    return rows.map(row => row.category);
  },

  // Get low stock products
  getLowStockProducts: async (): Promise<Product[]> => {
    return query<Product>(
      'SELECT * FROM products WHERE current_stock <= minimum_stock AND status = "Active" ORDER BY current_stock ASC'
    );
  },

  // Get inventory stats
  getStats: async () => {
    let totalProducts = 0;
    let totalStock = 0;
    let totalSerials = 0;
    let pendingPurchases = 0;
    let totalOrders = 0;

    try {
      const res = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM products');
      totalProducts = res?.count || 0;
    } catch (e) {}

    try {
      const res = await queryOne<{ sum: number }>('SELECT COALESCE(SUM(current_stock), 0) as sum FROM products');
      totalStock = res?.sum || 0;
    } catch (e) {}

    try {
      const res = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM product_serial_numbers');
      totalSerials = res?.count || 0;
      if (totalStock === 0) totalStock = totalSerials;
    } catch (e) {}

    try {
      const res = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM purchases WHERE status = "PENDING"');
      pendingPurchases = res?.count || 0;
    } catch (e) {}

    try {
      const res = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders');
      totalOrders = res?.count || 0;
    } catch (e) {}

    return {
      totalProducts,
      totalStock,
      totalSerials,
      pendingPurchases,
      totalOrders,
    };
  },

};

