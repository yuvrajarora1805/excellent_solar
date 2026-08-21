import { query, queryOne, insert, execute } from '@/lib/db';
import { generateDiscomId } from '@/lib/utils';
import type { DiscomApplication, DiscomStatus, Document, JeVerification, SdoVerification, XenVerification, Estimate } from '@/types';

export const discomDb = {
  // Find application by ID
  findById: async (id: number): Promise<(DiscomApplication & { project_id: string; customer_name: string }) | null> => {
    return queryOne(
      `SELECT da.*, p.project_id, c.name as customer_name
       FROM discom_applications da
       JOIN projects p ON da.project_id = p.id
       JOIN customers c ON p.customer_id = c.id
       WHERE da.id = ?`,
      [id]
    );
  },

  // Find application by application_id
  findByApplicationId: async (applicationId: string): Promise<DiscomApplication | null> => {
    return queryOne<DiscomApplication>('SELECT * FROM discom_applications WHERE application_id = ?', [applicationId]);
  },

  // Find by project ID
  findByProjectId: async (projectId: number): Promise<DiscomApplication | null> => {
    return queryOne<DiscomApplication>('SELECT * FROM discom_applications WHERE project_id = ?', [projectId]);
  },

  // Get all applications
  findAll: async (options?: {
    limit?: number;
    offset?: number;
    status?: DiscomStatus;
    search?: string;
  }): Promise<(DiscomApplication & { project_id: string; customer_name: string })[]> => {
    let sql = `SELECT da.*, p.project_id, c.name as customer_name
               FROM discom_applications da
               JOIN projects p ON da.project_id = p.id
               JOIN customers c ON p.customer_id = c.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('da.status = ?');
      params.push(options.status);
    }
    if (options?.search) {
      conditions.push('(da.application_id LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY da.created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return query(sql, params);
  },

  // Count applications
  count: async (options?: { status?: DiscomStatus; search?: string }): Promise<number> => {
    let sql = `SELECT COUNT(*) as count FROM discom_applications da
               JOIN projects p ON da.project_id = p.id
               JOIN customers c ON p.customer_id = c.id`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push('da.status = ?');
      params.push(options.status);
    }
    if (options?.search) {
      conditions.push('(da.application_id LIKE ? OR c.name LIKE ? OR c.mobile LIKE ?)');
      const searchPattern = `%${options.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await queryOne<{ count: number }>(sql, params);
    return result?.count || 0;
  },

  // Create new application
  create: async (projectId: number): Promise<number> => {
    const applicationId = await generateDiscomId();
    return insert(
      'INSERT INTO discom_applications (application_id, project_id, status) VALUES (?, ?, ?)',
      [applicationId, projectId, 'DRAFT']
    );
  },

  // Update application
  update: async (id: number, data: Partial<Omit<DiscomApplication, 'id' | 'application_id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.submitted_at !== undefined) {
      fields.push('submitted_at = ?');
      values.push(data.submitted_at || null);
    }
    if (data.completed_at !== undefined) {
      fields.push('completed_at = ?');
      values.push(data.completed_at || null);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE discom_applications SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Update status with history
  updateStatus: async (id: number, newStatus: DiscomStatus, changedBy: number, remarks?: string): Promise<void> => {
    // Get current status
    const application = await queryOne<Pick<DiscomApplication, 'status'>>('SELECT status FROM discom_applications WHERE id = ?', [id]);
    if (!application) throw new Error('Application not found');

    // Update status
    await execute('UPDATE discom_applications SET status = ? WHERE id = ?', [newStatus, id]);

    // Create history record
    await execute(
      'INSERT INTO discom_status_history (discom_application_id, old_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)',
      [id, application.status, newStatus, changedBy, remarks || null]
    );
  },

  // Delete application
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM discom_applications WHERE id = ?', [id]);
  },

  // Get status history
  getStatusHistory: async (applicationId: number) => {
    return query(
      `SELECT dsh.*, u.name as changed_by_name
       FROM discom_status_history dsh
       LEFT JOIN users u ON dsh.changed_by = u.id
       WHERE dsh.discom_application_id = ?
       ORDER BY dsh.created_at ASC`,
      [applicationId]
    );
  },

  // Get stats
  getStats: async () => {
    const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM discom_applications');
    const pendingJe = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM je_verifications WHERE status = 'PENDING'");
    const pendingSdo = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM sdo_verifications WHERE status = 'PENDING'");
    const pendingXen = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM xen_verifications WHERE status = 'PENDING'");

    return {
      total: total?.count || 0,
      pendingJe: pendingJe?.count || 0,
      pendingSdo: pendingSdo?.count || 0,
      pendingXen: pendingXen?.count || 0,
    };
  },
};

// Documents
export const documentDb = {
  // Get documents by application
  findByApplicationId: async (discomApplicationId: number): Promise<(Document & { document_type_name: string })[]> => {
    return query(
      `SELECT d.*, dt.name as document_type_name
       FROM documents d
       LEFT JOIN document_types dt ON d.document_type_id = dt.id
       WHERE d.discom_application_id = ?
       ORDER BY d.created_at DESC`,
      [discomApplicationId]
    );
  },

  // Get document checklist for application
  getChecklist: async (discomApplicationId: number): Promise<any[]> => {
    return query(
      `SELECT dt.*, dc.is_uploaded, dc.is_verified, d.id as document_id, d.status as document_status
       FROM document_types dt
       LEFT JOIN document_checklists dc ON dt.id = dc.document_type_id AND dc.discom_application_id = ?
       LEFT JOIN documents d ON d.document_type_id = dt.id AND d.discom_application_id = ?
       WHERE dt.status = 'Active'
       ORDER BY dt.id`,
      [discomApplicationId, discomApplicationId]
    );
  },

  // Create document
  create: async (data: Omit<Document, 'id' | 'created_at'>): Promise<number> => {
    const id = await insert(
      'INSERT INTO documents (discom_application_id, document_type_id, file_name, file_path, file_size, mime_type, status, rejection_reason, verified_by, verified_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.discom_application_id, data.document_type_id, data.file_name, data.file_path, data.file_size, data.mime_type, data.status, data.rejection_reason || null, data.verified_by || null, data.verified_at || null, data.created_by]
    );

    // Update checklist
    await execute(
      'INSERT INTO document_checklists (discom_application_id, document_type_id, is_uploaded) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_uploaded = 1',
      [data.discom_application_id, data.document_type_id]
    );

    return id;
  },

  // Verify document
  verifyDocument: async (id: number, approved: boolean, verifiedBy: number, rejectionReason?: string): Promise<number> => {
    const result = await execute(
      'UPDATE documents SET status = ?, verified_by = ?, verified_at = NOW(), rejection_reason = ? WHERE id = ?',
      [approved ? 'APPROVED' : 'REJECTED', verifiedBy, rejectionReason || null, id]
    );

    if (result > 0) {
      // Get document details
      const doc = await queryOne<Pick<Document, 'discom_application_id' | 'document_type_id'>>('SELECT discom_application_id, document_type_id FROM documents WHERE id = ?', [id]);

      if (doc) {
        // Update checklist
        await execute(
          'UPDATE document_checklists SET is_verified = 1 WHERE discom_application_id = ? AND document_type_id = ?',
          [doc.discom_application_id, doc.document_type_id]
        );
      }
    }

    return result;
  },

  // Delete document
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM documents WHERE id = ?', [id]);
  },
};

// JE Verification
export const jeVerificationDb = {
  findByApplicationId: async (discomApplicationId: number): Promise<JeVerification | null> => {
    return queryOne<JeVerification>('SELECT * FROM je_verifications WHERE discom_application_id = ?', [discomApplicationId]);
  },

  createOrUpdate: async (data: Omit<JeVerification, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const existing = await queryOne<{ id: number }>('SELECT id FROM je_verifications WHERE discom_application_id = ?', [data.discom_application_id]);

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.assigned_date !== undefined) {
        fields.push('assigned_date = ?');
        values.push(data.assigned_date || null);
      }
      if (data.visit_date !== undefined) {
        fields.push('visit_date = ?');
        values.push(data.visit_date || null);
      }
      if (data.status) {
        fields.push('status = ?');
        values.push(data.status);
      }
      if (data.remarks !== undefined) {
        fields.push('remarks = ?');
        values.push(data.remarks || null);
      }
      if (data.document_path !== undefined) {
        fields.push('document_path = ?');
        values.push(data.document_path || null);
      }

      if (fields.length > 0) {
        values.push(existing.id);
        await execute(`UPDATE je_verifications SET ${fields.join(', ')} WHERE id = ?`, values);
      }
      return existing.id;
    } else {
      return insert(
        'INSERT INTO je_verifications (discom_application_id, assigned_date, visit_date, status, remarks, document_path) VALUES (?, ?, ?, ?, ?, ?)',
        [data.discom_application_id, data.assigned_date || null, data.visit_date || null, data.status, data.remarks || null, data.document_path || null]
      );
    }
  },
};

// SDO Verification
export const sdoVerificationDb = {
  findByApplicationId: async (discomApplicationId: number): Promise<SdoVerification | null> => {
    return queryOne<SdoVerification>('SELECT * FROM sdo_verifications WHERE discom_application_id = ?', [discomApplicationId]);
  },

  createOrUpdate: async (data: Omit<SdoVerification, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const existing = await queryOne<{ id: number }>('SELECT id FROM sdo_verifications WHERE discom_application_id = ?', [data.discom_application_id]);

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.submission_date !== undefined) {
        fields.push('submission_date = ?');
        values.push(data.submission_date || null);
      }
      if (data.approval_date !== undefined) {
        fields.push('approval_date = ?');
        values.push(data.approval_date || null);
      }
      if (data.status) {
        fields.push('status = ?');
        values.push(data.status);
      }
      if (data.remarks !== undefined) {
        fields.push('remarks = ?');
        values.push(data.remarks || null);
      }

      if (fields.length > 0) {
        values.push(existing.id);
        await execute(`UPDATE sdo_verifications SET ${fields.join(', ')} WHERE id = ?`, values);
      }
      return existing.id;
    } else {
      return insert(
        'INSERT INTO sdo_verifications (discom_application_id, submission_date, approval_date, status, remarks) VALUES (?, ?, ?, ?, ?)',
        [data.discom_application_id, data.submission_date || null, data.approval_date || null, data.status, data.remarks || null]
      );
    }
  },
};

// XEN Verification
export const xenVerificationDb = {
  findByApplicationId: async (discomApplicationId: number): Promise<XenVerification | null> => {
    return queryOne<XenVerification>('SELECT * FROM xen_verifications WHERE discom_application_id = ?', [discomApplicationId]);
  },

  createOrUpdate: async (data: Omit<XenVerification, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const existing = await queryOne<{ id: number }>('SELECT id FROM xen_verifications WHERE discom_application_id = ?', [data.discom_application_id]);

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.submission_date !== undefined) {
        fields.push('submission_date = ?');
        values.push(data.submission_date || null);
      }
      if (data.approval_date !== undefined) {
        fields.push('approval_date = ?');
        values.push(data.approval_date || null);
      }
      if (data.status) {
        fields.push('status = ?');
        values.push(data.status);
      }
      if (data.remarks !== undefined) {
        fields.push('remarks = ?');
        values.push(data.remarks || null);
      }

      if (fields.length > 0) {
        values.push(existing.id);
        await execute(`UPDATE xen_verifications SET ${fields.join(', ')} WHERE id = ?`, values);
      }
      return existing.id;
    } else {
      return insert(
        'INSERT INTO xen_verifications (discom_application_id, submission_date, approval_date, status, remarks) VALUES (?, ?, ?, ?, ?)',
        [data.discom_application_id, data.submission_date || null, data.approval_date || null, data.status, data.remarks || null]
      );
    }
  },
};

// Estimates
export const estimateDb = {
  findByApplicationId: async (discomApplicationId: number): Promise<Estimate | null> => {
    return queryOne<Estimate>('SELECT * FROM estimates WHERE discom_application_id = ?', [discomApplicationId]);
  },

  createOrUpdate: async (data: Omit<Estimate, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const existing = await queryOne<{ id: number }>('SELECT id FROM estimates WHERE discom_application_id = ?', [data.discom_application_id]);

    if (existing) {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.estimate_number !== undefined) {
        fields.push('estimate_number = ?');
        values.push(data.estimate_number || null);
      }
      if (data.estimate_date !== undefined) {
        fields.push('estimate_date = ?');
        values.push(data.estimate_date || null);
      }
      if (data.estimate_amount !== undefined) {
        fields.push('estimate_amount = ?');
        values.push(data.estimate_amount || null);
      }
      if (data.fee_amount !== undefined) {
        fields.push('fee_amount = ?');
        values.push(data.fee_amount || null);
      }
      if (data.status) {
        fields.push('status = ?');
        values.push(data.status);
      }

      if (fields.length > 0) {
        values.push(existing.id);
        await execute(`UPDATE estimates SET ${fields.join(', ')} WHERE id = ?`, values);
      }
      return existing.id;
    } else {
      return insert(
        'INSERT INTO estimates (discom_application_id, estimate_number, estimate_date, estimate_amount, fee_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
        [data.discom_application_id, data.estimate_number || null, data.estimate_date || null, data.estimate_amount || null, data.fee_amount || null, data.status]
      );
    }
  },
};

// Portal Updates
export const portalUpdateDb = {
  findByApplicationId: async (discomApplicationId: number): Promise<any[]> => {
    return query(
      `SELECT pu.*, u.name as user_name
       FROM portal_updates pu
       LEFT JOIN users u ON pu.user_id = u.id
       WHERE pu.discom_application_id = ?
       ORDER BY pu.date DESC`,
      [discomApplicationId]
    );
  },

  create: async (data: Omit<any, 'id' | 'created_at'>): Promise<number> => {
    return insert(
      'INSERT INTO portal_updates (discom_application_id, date, user_id, action, reference_number, status, remarks, screenshot_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.discom_application_id, data.date, data.user_id, data.action, data.reference_number || null, data.status, data.remarks || null, data.screenshot_path || null]
    );
  },
};
