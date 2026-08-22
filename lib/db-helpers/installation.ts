import { query, queryOne, insert, execute } from '@/lib/db';
import type { Installation } from '@/types';

export interface InstallationPhoto {
  id: number;
  installation_id: number;
  category: string;
  subcategory?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: Date;
}

export const installationDb = {
  // Find installation by project ID
  findByProjectId: async (projectId: number): Promise<(Installation & { photos: InstallationPhoto[] }) | null> => {
    const installation = await queryOne<Installation>(
      `SELECT i.*, u.name as created_by_name
       FROM installations i
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.project_id = ?`,
      [projectId]
    );

    if (!installation) return null;

    const photos = await query<InstallationPhoto>(
      'SELECT * FROM installation_photos WHERE installation_id = ? ORDER BY created_at ASC',
      [installation.id]
    );

    return { ...installation, photos };
  },

  // Find installation by ID
  findById: async (id: number): Promise<(Installation & { photos: InstallationPhoto[] }) | null> => {
    const installation = await queryOne<Installation>(
      `SELECT i.*, u.name as created_by_name, p.project_id, p.customer_id
       FROM installations i
       LEFT JOIN projects p ON i.project_id = p.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (!installation) return null;

    const photos = await query<InstallationPhoto>(
      'SELECT * FROM installation_photos WHERE installation_id = ? ORDER BY created_at ASC',
      [id]
    );

    return { ...installation, photos };
  },

  // Get all installations
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    status?: string;
    createdBy?: number;
  }): Promise<(Installation & { project_id: string; customer_name: string })[]> => {
    let sql = `SELECT i.*, p.project_id, c.name as customer_name, u.name as created_by_name
               FROM installations i
               JOIN projects p ON i.project_id = p.id
               JOIN customers c ON p.customer_id = c.id
               LEFT JOIN users u ON i.created_by = u.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('i.status = ?');
      params.push(options.status);
    }
    if (options?.createdBy) {
      conditions.push('i.created_by = ?');
      params.push(options.createdBy);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY i.created_at DESC';

    if (options?.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    return query(sql, params);
  },

  // Create new installation
  create: async (data: Omit<Installation, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    return insert(
      `INSERT INTO installations (project_id, installation_date, installed_capacity, panel_quantity, inverter_model,
                                  structure_installed, earthing_completed, wiring_completed, testing_completed,
                                  remarks, status, submitted_at, verified_at, rejection_reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.installation_date || null,
        data.installed_capacity || null,
        data.panel_quantity || null,
        data.inverter_model || null,
        data.structure_installed,
        data.earthing_completed,
        data.wiring_completed,
        data.testing_completed,
        data.remarks || null,
        data.status,
        data.submitted_at || null,
        data.verified_at || null,
        data.rejection_reason || null,
        data.created_by,
      ]
    );
  },

  // Update installation
  update: async (id: number, data: Partial<Omit<Installation, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'project_id'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.installation_date !== undefined) {
      fields.push('installation_date = ?');
      values.push(data.installation_date || null);
    }
    if (data.installed_capacity !== undefined) {
      fields.push('installed_capacity = ?');
      values.push(data.installed_capacity || null);
    }
    if (data.panel_quantity !== undefined) {
      fields.push('panel_quantity = ?');
      values.push(data.panel_quantity || null);
    }
    if (data.inverter_model !== undefined) {
      fields.push('inverter_model = ?');
      values.push(data.inverter_model || null);
    }
    if (data.structure_installed !== undefined) {
      fields.push('structure_installed = ?');
      values.push(data.structure_installed);
    }
    if (data.earthing_completed !== undefined) {
      fields.push('earthing_completed = ?');
      values.push(data.earthing_completed);
    }
    if (data.wiring_completed !== undefined) {
      fields.push('wiring_completed = ?');
      values.push(data.wiring_completed);
    }
    if (data.testing_completed !== undefined) {
      fields.push('testing_completed = ?');
      values.push(data.testing_completed);
    }
    if (data.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(data.remarks || null);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.submitted_at !== undefined) {
      fields.push('submitted_at = ?');
      values.push(data.submitted_at || null);
    }
    if (data.verified_at !== undefined) {
      fields.push('verified_at = ?');
      values.push(data.verified_at || null);
    }
    if (data.rejection_reason !== undefined) {
      fields.push('rejection_reason = ?');
      values.push(data.rejection_reason || null);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE installations SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Submit installation for verification
  submitForVerification: async (id: number): Promise<number> => {
    return execute(
      'UPDATE installations SET status = ?, submitted_at = NOW() WHERE id = ?',
      ['SUBMITTED', id]
    );
  },

  // Verify installation
  verifyInstallation: async (id: number, approved: boolean, rejectionReason?: string): Promise<number> => {
    return execute(
      'UPDATE installations SET status = ?, verified_at = NOW(), rejection_reason = ? WHERE id = ?',
      [approved ? 'VERIFIED' : 'REJECTED', rejectionReason || null, id]
    );
  },

  // Add photo
  addPhoto: async (data: Omit<InstallationPhoto, 'id' | 'created_at'>): Promise<number> => {
    return insert(
      'INSERT INTO installation_photos (installation_id, category, subcategory, file_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.installation_id, data.category, data.subcategory || null, data.file_name, data.file_path, data.file_size, data.mime_type]
    );
  },

  // Delete photo
  deletePhoto: async (id: number): Promise<number> => {
    return execute('DELETE FROM installation_photos WHERE id = ?', [id]);
  },

  // Delete installation
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM installations WHERE id = ?', [id]);
  },

  // Get pending installations
  getPendingInstallations: async (): Promise<(Installation & { project_id: string; customer_name: string })[]> => {
    return query(
      `SELECT i.*, p.project_id, c.name as customer_name, u.name as created_by_name
       FROM installations i
       JOIN projects p ON i.project_id = p.id
       JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.status = 'SUBMITTED'
       ORDER BY i.submitted_at ASC`
    );
  },

  // Count by status
  countByStatus: async (status?: string): Promise<number> => {
    const result = status
      ? await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM installations WHERE status = ?', [status])
      : await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM installations');
    return result?.count || 0;
  },
};
