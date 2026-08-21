import { query, queryOne, insert, execute } from '@/lib/db';
import { generateProjectId } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/types';

export const projectDb = {
  // Find project by ID
  findById: async (id: number): Promise<Project | null> => {
    return queryOne<Project>(
      `SELECT p.*, c.name as customer_name, c.mobile as customer_mobile
       FROM projects p
       JOIN customers c ON p.customer_id = c.id
       WHERE p.id = ?`,
      [id]
    );
  },

  // Find project by project_id
  findByProjectId: async (projectId: string): Promise<Project | null> => {
    return queryOne<Project>(
      `SELECT p.*, c.name as customer_name, c.mobile as customer_mobile
       FROM projects p
       JOIN customers c ON p.customer_id = c.id
       WHERE p.project_id = ?`,
      [projectId]
    );
  },

  // Get all projects
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    status?: ProjectStatus;
    customerId?: number;
    createdBy?: number;
    search?: string;
  }): Promise<Project[]> => {
    let sql = `SELECT p.*, c.name as customer_name, c.mobile as customer_mobile
               FROM projects p
               JOIN customers c ON p.customer_id = c.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('p.status = ?');
      params.push(options.status);
    }
    if (options?.customerId) {
      conditions.push('p.customer_id = ?');
      params.push(options.customerId);
    }
    if (options?.createdBy) {
      conditions.push('p.created_by = ?');
      params.push(options.createdBy);
    }
    if (options?.search) {
      conditions.push('(p.project_id LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY p.created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return query<Project>(sql, params);
  },

  // Count projects
  count: async (options?: {
    status?: ProjectStatus;
    customerId?: number;
    createdBy?: number;
    search?: string;
  }): Promise<number> => {
    let sql = `SELECT COUNT(*) as count FROM projects p
               JOIN customers c ON p.customer_id = c.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('p.status = ?');
      params.push(options.status);
    }
    if (options?.customerId) {
      conditions.push('p.customer_id = ?');
      params.push(options.customerId);
    }
    if (options?.createdBy) {
      conditions.push('p.created_by = ?');
      params.push(options.createdBy);
    }
    if (options?.search) {
      conditions.push('(p.project_id LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  },

  // Create new project
  create: async (data: Omit<Project, 'id' | 'project_id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const projectId = await generateProjectId();
    const id = await insert(
      `INSERT INTO projects (project_id, customer_id, status, account_number, consumer_number, discom,
                          subdivision, division, sanctioned_load, solar_load, site_address, latitude, longitude,
                          capacity, installation_date, created_by, verified_by, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        data.customer_id,
        data.status,
        data.account_number || null,
        data.consumer_number || null,
        data.discom || null,
        data.subdivision || null,
        data.division || null,
        data.sanctioned_load || null,
        data.solar_load || null,
        data.site_address || null,
        data.latitude || null,
        data.longitude || null,
        data.capacity || null,
        data.installation_date || null,
        data.created_by,
        data.verified_by || null,
        data.verified_at || null,
      ]
    );

    // Create status history
    await execute(
      'INSERT INTO project_status_history (project_id, old_status, new_status, changed_by) VALUES (?, NULL, ?, ?)',
      [id, data.status, data.created_by]
    );

    return id;
  },

  // Update project
  update: async (id: number, data: Partial<Omit<Project, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.customer_id) {
      fields.push('customer_id = ?');
      values.push(data.customer_id);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.account_number !== undefined) {
      fields.push('account_number = ?');
      values.push(data.account_number || null);
    }
    if (data.consumer_number !== undefined) {
      fields.push('consumer_number = ?');
      values.push(data.consumer_number || null);
    }
    if (data.discom !== undefined) {
      fields.push('discom = ?');
      values.push(data.discom || null);
    }
    if (data.subdivision !== undefined) {
      fields.push('subdivision = ?');
      values.push(data.subdivision || null);
    }
    if (data.division !== undefined) {
      fields.push('division = ?');
      values.push(data.division || null);
    }
    if (data.sanctioned_load !== undefined) {
      fields.push('sanctioned_load = ?');
      values.push(data.sanctioned_load || null);
    }
    if (data.solar_load !== undefined) {
      fields.push('solar_load = ?');
      values.push(data.solar_load || null);
    }
    if (data.site_address !== undefined) {
      fields.push('site_address = ?');
      values.push(data.site_address || null);
    }
    if (data.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(data.latitude || null);
    }
    if (data.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(data.longitude || null);
    }
    if (data.capacity !== undefined) {
      fields.push('capacity = ?');
      values.push(data.capacity || null);
    }
    if (data.installation_date !== undefined) {
      fields.push('installation_date = ?');
      values.push(data.installation_date || null);
    }
    if (data.verified_by !== undefined) {
      fields.push('verified_by = ?');
      values.push(data.verified_by || null);
    }
    if (data.verified_at !== undefined) {
      fields.push('verified_at = ?');
      values.push(data.verified_at || null);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Update project status
  updateStatus: async (id: number, newStatus: ProjectStatus, changedBy: number, remarks?: string): Promise<void> => {
    // Get current status
    const project = await queryOne<Pick<Project, 'status'>>('SELECT status FROM projects WHERE id = ?', [id]);
    if (!project) throw new Error('Project not found');

    // Update status
    await execute('UPDATE projects SET status = ? WHERE id = ?', [newStatus, id]);

    // Create history record
    await execute(
      'INSERT INTO project_status_history (project_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
      [id, project.status, newStatus, changedBy, remarks || null]
    );
  },

  // Delete project
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM projects WHERE id = ?', [id]);
  },

  // Get projects by status
  findByStatus: async (status: ProjectStatus): Promise<Project[]> => {
    return query<Project>(
      `SELECT p.*, c.name as customer_name
       FROM projects p
       JOIN customers c ON p.customer_id = c.id
       WHERE p.status = ?
       ORDER BY p.created_at DESC`,
      [status]
    );
  },

  // Get dashboard stats
  getStats: async () => {
    const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM projects');
    const installation = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM projects WHERE status = 'INSTALLATION_STARTED'");
    const completed = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM projects WHERE status = 'PROJECT_COMPLETED'");
    const pending = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM projects WHERE status IN ('SURVEY_SUBMITTED', 'INSTALLATION_COMPLETED')");

    return {
      total: total?.count || 0,
      installation: installation?.count || 0,
      completed: completed?.count || 0,
      pendingVerification: pending?.count || 0,
    };
  },

  // Get project status history
  getStatusHistory: async (projectId: number) => {
    return query(
      `SELECT psh.*, u.name as changed_by_name
       FROM project_status_history psh
       LEFT JOIN users u ON psh.changed_by = u.id
       WHERE psh.project_id = ?
       ORDER BY psh.created_at ASC`,
      [projectId]
    );
  },
};
