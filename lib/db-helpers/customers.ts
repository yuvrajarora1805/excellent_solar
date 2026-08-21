import { query, queryOne, insert, execute } from '@/lib/db';
import type { Customer } from '@/types';

export const customerDb = {
  // Find customer by ID
  findById: async (id: number): Promise<Customer | null> => {
    return queryOne<Customer>('SELECT * FROM customers WHERE id = ?', [id]);
  },

  // Find customer by mobile
  findByMobile: async (mobile: string): Promise<Customer | null> => {
    return queryOne<Customer>('SELECT * FROM customers WHERE mobile = ?', [mobile]);
  },

  // Get all customers
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Customer[]> => {
    let sql = 'SELECT * FROM customers';
    const params: any[] = [];

    if (options?.search) {
      sql += ' WHERE name LIKE ? OR mobile LIKE ? OR email LIKE ?';
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return query<Customer>(sql, params);
  },

  // Count customers
  count: async (search?: string): Promise<number> => {
    let sql = 'SELECT COUNT(*) as count FROM customers';
    const params: any[] = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR mobile LIKE ? OR email LIKE ?';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  },

  // Create new customer
  create: async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    return insert(
      'INSERT INTO customers (name, mobile, email, address, city, district, state) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.name, data.mobile, data.email || null, data.address, data.city, data.district, data.state]
    );
  },

  // Update customer
  update: async (id: number, data: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.mobile) {
      fields.push('mobile = ?');
      values.push(data.mobile);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email || null);
    }
    if (data.address) {
      fields.push('address = ?');
      values.push(data.address);
    }
    if (data.city) {
      fields.push('city = ?');
      values.push(data.city);
    }
    if (data.district) {
      fields.push('district = ?');
      values.push(data.district);
    }
    if (data.state) {
      fields.push('state = ?');
      values.push(data.state);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE customers SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete customer
  delete: async (id: number): Promise<number> => {
    // Check if customer has projects
    const projects = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM projects WHERE customer_id = ?', [id]);
    if (projects && projects.count > 0) {
      throw new Error('Cannot delete customer with existing projects');
    }
    return execute('DELETE FROM customers WHERE id = ?', [id]);
  },

  // Get customers with project count
  findAllWithProjectCount: async (): Promise<(Customer & { project_count: number })[]> => {
    return query(
      `SELECT c.*, COUNT(p.id) as project_count
       FROM customers c
       LEFT JOIN projects p ON c.id = p.customer_id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );
  },
};
