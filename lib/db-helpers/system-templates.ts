import { query, queryOne, insert, execute, transaction } from '@/lib/db';
import type { SystemTemplate, SystemTemplateItem } from '@/types';

export const systemTemplateDb = {
  // Find all templates
  findAll: async (options?: {
    system_type?: string;
    capacity_kw?: number;
    status?: string;
  }): Promise<SystemTemplate[]> => {
    let sql = `
      SELECT st.*, u.name as created_by_name
      FROM system_templates st
      LEFT JOIN users u ON st.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.system_type) {
      sql += ' AND st.system_type = ?';
      params.push(options.system_type);
    }
    if (options?.capacity_kw) {
      sql += ' AND st.capacity_kw = ?';
      params.push(options.capacity_kw);
    }
    if (options?.status) {
      sql += ' AND st.status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY st.capacity_kw ASC, st.name ASC';

    const templates = await query<any>(sql, params);
    return templates.map(t => ({
      ...t,
      created_by_user: t.created_by_name ? { id: t.created_by, name: t.created_by_name } : undefined,
    }));
  },

  // Find by ID with items
  findById: async (id: number): Promise<SystemTemplate | null> => {
    const template = await queryOne<any>(
      `SELECT st.*, u.name as created_by_name
       FROM system_templates st
       LEFT JOIN users u ON st.created_by = u.id
       WHERE st.id = ?`,
      [id]
    );

    if (!template) return null;

    // Get items
    const items = await query<any>(
      `SELECT sti.*, p.name as product_name, p.product_code
       FROM system_template_items sti
       LEFT JOIN products p ON sti.product_id = p.id
       WHERE sti.system_template_id = ?
       ORDER BY sti.sort_order ASC`,
      [id]
    );

    return {
      ...template,
      created_by_user: template.created_by_name ? { id: template.created_by, name: template.created_by_name } : undefined,
      items: items.map(i => ({
        ...i,
        product: i.product_id ? { id: i.product_id, name: i.product_name, product_code: i.product_code } : undefined,
      })),
    };
  },

  // Find by code
  findByCode: async (code: string): Promise<SystemTemplate | null> => {
    return queryOne<SystemTemplate>('SELECT * FROM system_templates WHERE code = ?', [code]);
  },

  // Create new template
  create: async (data: Omit<SystemTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by_user'> & { items?: Array<Omit<SystemTemplateItem, 'id' | 'system_template_id' | 'created_at'>> }, userId: number): Promise<number> => {
    return transaction(async (conn) => {
      // Insert template
      const [result] = await conn.execute(
        `INSERT INTO system_templates (name, code, description, system_type, capacity_kw, template_type, status, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.name, data.code, data.description || null, data.system_type ?? null, data.capacity_kw ?? null, data.template_type ?? null, data.status ?? 'ACTIVE', userId]
      );
      const templateId = (result as any).insertId;

      // Insert items if provided
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          await conn.execute(
            `INSERT INTO system_template_items (system_template_id, product_id, quantity, unit, is_optional, sort_order, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [templateId, item.product_id, item.quantity, item.unit ?? null, item.is_optional ?? 0, item.sort_order ?? 0, item.remarks || null]
          );
        }
      }

      return templateId;
    });
  },

  // Update template
  update: async (id: number, data: Partial<Omit<SystemTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_user'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.code) {
      fields.push('code = ?');
      values.push(data.code);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.system_type) {
      fields.push('system_type = ?');
      values.push(data.system_type);
    }
    if (data.capacity_kw !== undefined) {
      fields.push('capacity_kw = ?');
      values.push(data.capacity_kw);
    }
    if (data.template_type) {
      fields.push('template_type = ?');
      values.push(data.template_type);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE system_templates SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete template
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM system_templates WHERE id = ?', [id]);
  },

  // Add item to template
  addItem: async (templateId: number, item: Omit<SystemTemplateItem, 'id' | 'system_template_id' | 'created_at'>): Promise<number> => {
    return insert(
      `INSERT INTO system_template_items (system_template_id, product_id, quantity, unit, is_optional, sort_order, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [templateId, item.product_id, item.quantity, item.unit, item.is_optional, item.sort_order, item.remarks || null]
    );
  },

  // Update item
  updateItem: async (id: number, item: Partial<Omit<SystemTemplateItem, 'id' | 'system_template_id' | 'created_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (item.product_id) {
      fields.push('product_id = ?');
      values.push(item.product_id);
    }
    if (item.quantity !== undefined) {
      fields.push('quantity = ?');
      values.push(item.quantity);
    }
    if (item.unit) {
      fields.push('unit = ?');
      values.push(item.unit);
    }
    if (item.is_optional !== undefined) {
      fields.push('is_optional = ?');
      values.push(item.is_optional);
    }
    if (item.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(item.sort_order);
    }
    if (item.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(item.remarks);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE system_template_items SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Remove item
  removeItem: async (id: number): Promise<number> => {
    return execute('DELETE FROM system_template_items WHERE id = ?', [id]);
  },
};
