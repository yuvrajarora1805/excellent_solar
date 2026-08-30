import { query, queryOne, insert, execute } from '@/lib/db';
import type { SiteSurvey } from '@/types';

export interface SiteSurveyPhoto {
  id: number;
  site_survey_id: number;
  category: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  latitude?: number;
  longitude?: number;
  created_at: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
}

export const siteSurveyDb = {
  // Find survey by project ID
  findByProjectId: async (projectId: number): Promise<(SiteSurvey & { photos: SiteSurveyPhoto[] }) | null> => {
    const survey = await queryOne<SiteSurvey>(
      `SELECT ss.*, u.name as created_by_name
       FROM site_surveys ss
       LEFT JOIN users u ON ss.created_by = u.id
       WHERE ss.project_id = ?`,
      [projectId]
    );

    if (!survey) return null;

    const photos = await query<any>(
      `SELECT ssp.*, COALESCE(u.name, su.name, 'Field Worker') as uploader_name, COALESCE(u.role, su.role, 'MARKETING') as uploader_role
       FROM site_survey_photos ssp
       LEFT JOIN users u ON ssp.uploaded_by = u.id
       LEFT JOIN site_surveys ss ON ssp.site_survey_id = ss.id
       LEFT JOIN users su ON ss.created_by = su.id
       WHERE ssp.site_survey_id = ? ORDER BY ssp.created_at ASC`,
      [survey.id]
    );

    return { ...survey, photos };
  },

  // Find survey by ID
  findById: async (id: number): Promise<(SiteSurvey & { photos: SiteSurveyPhoto[] }) | null> => {
    const survey = await queryOne<SiteSurvey>(
      `SELECT ss.*, u.name as created_by_name, p.customer_id
       FROM site_surveys ss
       LEFT JOIN projects p ON ss.project_id = p.id
       LEFT JOIN users u ON ss.created_by = u.id
       WHERE ss.id = ?`,
      [id]
    );

    if (!survey) return null;

    const photos = await query<any>(
      `SELECT ssp.*, COALESCE(u.name, su.name, 'Field Worker') as uploader_name, COALESCE(u.role, su.role, 'MARKETING') as uploader_role
       FROM site_survey_photos ssp
       LEFT JOIN users u ON ssp.uploaded_by = u.id
       LEFT JOIN site_surveys ss ON ssp.site_survey_id = ss.id
       LEFT JOIN users su ON ss.created_by = su.id
       WHERE ssp.site_survey_id = ? ORDER BY ssp.created_at ASC`,
      [id]
    );

    return { ...survey, photos };
  },

  // Get all surveys
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    status?: string;
    createdBy?: number;
  }): Promise<(SiteSurvey & { project_id: string; customer_name: string })[]> => {
    let sql = `SELECT ss.*, c.name as customer_name, u.name as created_by_name
               FROM site_surveys ss
               JOIN projects p ON ss.project_id = p.id
               JOIN customers c ON p.customer_id = c.id
               LEFT JOIN users u ON ss.created_by = u.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('ss.status = ?');
      params.push(options.status);
    }
    if (options?.createdBy) {
      conditions.push('ss.created_by = ?');
      params.push(options.createdBy);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY ss.created_at DESC';

    if (options?.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    return query(sql, params);
  },

  // Create new survey
  create: async (data: Omit<SiteSurvey, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    return insert(
      `INSERT INTO site_surveys (project_id, roof_type, roof_condition, available_area, roof_length, roof_width,
                                  shading, extra_structure, structure_type, structure_qty, structure_cost,
                                  estimated_capacity, remarks, latitude, longitude, accuracy, status,
                                  submitted_at, verified_at, rejection_reason, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.roof_type || null,
        data.roof_condition || null,
        data.available_area || null,
        data.roof_length || null,
        data.roof_width || null,
        data.shading,
        data.extra_structure,
        data.structure_type || null,
        data.structure_qty || null,
        data.structure_cost || null,
        data.estimated_capacity || null,
        data.remarks || null,
        data.latitude || null,
        data.longitude || null,
        data.accuracy || null,
        data.status,
        data.submitted_at || null,
        data.verified_at || null,
        data.rejection_reason || null,
        data.created_by,
      ]
    );
  },

  // Update survey
  update: async (id: number, data: Partial<Omit<SiteSurvey, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'project_id'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.roof_type !== undefined) {
      fields.push('roof_type = ?');
      values.push(data.roof_type || null);
    }
    if (data.roof_condition !== undefined) {
      fields.push('roof_condition = ?');
      values.push(data.roof_condition || null);
    }
    if (data.available_area !== undefined) {
      fields.push('available_area = ?');
      values.push(data.available_area || null);
    }
    if (data.roof_length !== undefined) {
      fields.push('roof_length = ?');
      values.push(data.roof_length || null);
    }
    if (data.roof_width !== undefined) {
      fields.push('roof_width = ?');
      values.push(data.roof_width || null);
    }
    if (data.shading !== undefined) {
      fields.push('shading = ?');
      values.push(data.shading);
    }
    if (data.extra_structure !== undefined) {
      fields.push('extra_structure = ?');
      values.push(data.extra_structure);
    }
    if (data.structure_type !== undefined) {
      fields.push('structure_type = ?');
      values.push(data.structure_type || null);
    }
    if (data.structure_qty !== undefined) {
      fields.push('structure_qty = ?');
      values.push(data.structure_qty || null);
    }
    if (data.structure_cost !== undefined) {
      fields.push('structure_cost = ?');
      values.push(data.structure_cost || null);
    }
    if (data.estimated_capacity !== undefined) {
      fields.push('estimated_capacity = ?');
      values.push(data.estimated_capacity || null);
    }
    if (data.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(data.remarks || null);
    }
    if (data.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(data.latitude || null);
    }
    if (data.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(data.longitude || null);
    }
    if (data.accuracy !== undefined) {
      fields.push('accuracy = ?');
      values.push(data.accuracy || null);
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
      `UPDATE site_surveys SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Submit survey for verification
  submitForVerification: async (id: number): Promise<number> => {
    return execute(
      'UPDATE site_surveys SET status = ?, submitted_at = NOW() WHERE id = ?',
      ['SUBMITTED', id]
    );
  },

  // Verify survey
  verifySurvey: async (id: number, approved: boolean, rejectionReason?: string): Promise<number> => {
    return execute(
      'UPDATE site_surveys SET status = ?, verified_at = NOW(), rejection_reason = ? WHERE id = ?',
      [approved ? 'VERIFIED' : 'REJECTED', rejectionReason || null, id]
    );
  },

  // Add photo
  addPhoto: async (data: Omit<SiteSurveyPhoto, 'id' | 'created_at'>): Promise<number> => {
    return insert(
      'INSERT INTO site_survey_photos (site_survey_id, category, file_name, file_path, file_size, mime_type, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.site_survey_id, data.category, data.file_name, data.file_path, data.file_size, data.mime_type, data.latitude || null, data.longitude || null]
    );
  },

  // Delete photo
  deletePhoto: async (id: number): Promise<number> => {
    return execute('DELETE FROM site_survey_photos WHERE id = ?', [id]);
  },

  // Delete survey
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM site_surveys WHERE id = ?', [id]);
  },

  // Get pending surveys
  getPendingSurveys: async (): Promise<(SiteSurvey & { project_id: string; customer_name: string })[]> => {
    return query(
      `SELECT ss.*, c.name as customer_name, u.name as created_by_name
       FROM site_surveys ss
       JOIN projects p ON ss.project_id = p.id
       JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON ss.created_by = u.id
       WHERE ss.status = 'SUBMITTED'
       ORDER BY ss.submitted_at ASC`
    );
  },

  // Count by status
  countByStatus: async (status?: string): Promise<number> => {
    const result = status
      ? await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM site_surveys WHERE status = ?', [status])
      : await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM site_surveys');
    return result?.count || 0;
  },
};
