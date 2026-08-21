import { query, queryOne, insert, execute } from '@/lib/db';
import { hashPassword } from '@/lib/utils';
import type { User, Role } from '@/types';

export const userDb = {
  // Find user by email
  findByEmail: async (email: string): Promise<User | null> => {
    return queryOne<User>(
      'SELECT id, email, name, role, mobile, active, created_at, updated_at FROM users WHERE email = ?',
      [email]
    );
  },

  // Find user by ID
  findById: async (id: number): Promise<User | null> => {
    return queryOne<User>(
      'SELECT id, email, name, role, mobile, active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
  },

  // Get all users
  findAll: async (): Promise<User[]> => {
    return query<User>(
      'SELECT id, email, name, role, mobile, active, created_at, updated_at FROM users ORDER BY created_at DESC'
    );
  },

  // Get users by role
  findByRole: async (role: Role): Promise<User[]> => {
    return query<User>(
      'SELECT id, email, name, role, mobile, active, created_at, updated_at FROM users WHERE role = ? AND active = 1 ORDER BY name',
      [role]
    );
  },

  // Create new user
  create: async (data: {
    email: string;
    name: string;
    password: string;
    role: Role;
    mobile?: string;
  }): Promise<number> => {
    const hashedPassword = await hashPassword(data.password);
    return insert(
      'INSERT INTO users (email, name, password, role, mobile) VALUES (?, ?, ?, ?, ?)',
      [data.email, data.name, hashedPassword, data.role, data.mobile || null]
    );
  },

  // Update user
  update: async (id: number, data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.email) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.role) {
      fields.push('role = ?');
      values.push(data.role);
    }
    if (data.mobile !== undefined) {
      fields.push('mobile = ?');
      values.push(data.mobile);
    }
    if (data.active !== undefined) {
      fields.push('active = ?');
      values.push(data.active);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Update password
  updatePassword: async (id: number, newPassword: string): Promise<number> => {
    const hashedPassword = await hashPassword(newPassword);
    return execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  },

  // Delete (deactivate) user
  delete: async (id: number): Promise<number> => {
    return execute('UPDATE users SET active = 0 WHERE id = ?', [id]);
  },

  // Count users by role
  countByRole: async (role?: Role): Promise<number> => {
    const result = role
      ? await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE role = ? AND active = 1', [role])
      : await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE active = 1');
    return result?.count || 0;
  },
};
