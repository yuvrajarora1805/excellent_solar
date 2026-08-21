import { query, queryOne, insert, execute } from '@/lib/db';
import type { ServiceTicket, ServiceVisit, AmcContract, Warranty, ServiceTicketStatus, ServicePriority } from '@/types';

export const warrantyDb = {
  // Find all warranties for a project
  findByProject: async (projectId: number): Promise<Warranty[]> => {
    return query<Warranty>('SELECT * FROM warranties WHERE project_id = ? ORDER BY start_date DESC', [projectId]);
  },

  // Find active warranties
  findActive: async (projectId: number): Promise<Warranty[]> => {
    return query<Warranty>(
      "SELECT * FROM warranties WHERE project_id = ? AND status = 'ACTIVE' AND end_date >= CURDATE()",
      [projectId]
    );
  },

  // Create warranty
  create: async (data: Omit<Warranty, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    return insert(
      'INSERT INTO warranties (project_id, warranty_type, start_date, end_date, coverage_details, terms_conditions, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.project_id, data.warranty_type, data.start_date, data.end_date, data.coverage_details || null, data.terms_conditions || null, data.status]
    );
  },

  // Update warranty
  update: async (id: number, data: Partial<Omit<Warranty, 'id' | 'project_id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.warranty_type) {
      fields.push('warranty_type = ?');
      values.push(data.warranty_type);
    }
    if (data.start_date) {
      fields.push('start_date = ?');
      values.push(data.start_date);
    }
    if (data.end_date) {
      fields.push('end_date = ?');
      values.push(data.end_date);
    }
    if (data.coverage_details !== undefined) {
      fields.push('coverage_details = ?');
      values.push(data.coverage_details);
    }
    if (data.terms_conditions !== undefined) {
      fields.push('terms_conditions = ?');
      values.push(data.terms_conditions);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE warranties SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete warranty
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM warranties WHERE id = ?', [id]);
  },
};

export const amcDb = {
  // Find all AMC contracts
  findAll: async (options?: {
    project_id?: number;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AmcContract[]> => {
    let sql = `
      SELECT ac.*, p.project_id, c.name as customer_name, u.name as created_by_name
      FROM amc_contracts ac
      LEFT JOIN projects p ON ac.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN users u ON ac.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.project_id) {
      sql += ' AND ac.project_id = ?';
      params.push(options.project_id);
    }
    if (options?.status) {
      sql += ' AND ac.status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY ac.created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return query<AmcContract>(sql, params);
  },

  // Find by ID
  findById: async (id: number): Promise<AmcContract | null> => {
    return queryOne<AmcContract>(
      `SELECT ac.*, p.project_id, c.name as customer_name, u.name as created_by_name
       FROM amc_contracts ac
       LEFT JOIN projects p ON ac.project_id = p.id
       LEFT JOIN customers c ON p.customer_id = c.id
       LEFT JOIN users u ON ac.created_by = u.id
       WHERE ac.id = ?`,
      [id]
    );
  },

  // Find by contract number
  findByNumber: async (contractNumber: string): Promise<AmcContract | null> => {
    return queryOne<AmcContract>('SELECT * FROM amc_contracts WHERE contract_number = ?', [contractNumber]);
  },

  // Find active AMCs for a project
  findActiveByProject: async (projectId: number): Promise<AmcContract[]> => {
    return query<AmcContract>(
      "SELECT * FROM amc_contracts WHERE project_id = ? AND status = 'ACTIVE' AND end_date >= CURDATE()",
      [projectId]
    );
  },

  // Generate AMC number
  generateNumber: async (): Promise<string> => {
    const year = new Date().getFullYear();
    const count = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM amc_contracts WHERE YEAR(created_at) = ?',
      [year]
    );
    const seq = (count?.count || 0) + 1;
    return `AMC-${year}-${seq.toString().padStart(4, '0')}`;
  },

  // Create AMC
  create: async (data: Omit<AmcContract, 'id' | 'contract_number' | 'created_at' | 'updated_at' | 'created_by_user'>, userId: number): Promise<number> => {
    const contractNumber = await amcDb.generateNumber();
    return insert(
      `INSERT INTO amc_contracts (contract_number, project_id, start_date, end_date, contract_amount, payment_status,
       service_visits, completed_visits, cleaning_included, inspection_included, repairs_included, terms_conditions, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        contractNumber,
        data.project_id,
        data.start_date,
        data.end_date,
        data.contract_amount || null,
        data.payment_status,
        data.service_visits,
        data.completed_visits,
        data.cleaning_included,
        data.inspection_included,
        data.repairs_included,
        data.terms_conditions || null,
        data.status,
        userId,
      ]
    );
  },

  // Update AMC
  update: async (id: number, data: Partial<Omit<AmcContract, 'id' | 'contract_number' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_user'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.start_date) {
      fields.push('start_date = ?');
      values.push(data.start_date);
    }
    if (data.end_date) {
      fields.push('end_date = ?');
      values.push(data.end_date);
    }
    if (data.contract_amount !== undefined) {
      fields.push('contract_amount = ?');
      values.push(data.contract_amount);
    }
    if (data.payment_status) {
      fields.push('payment_status = ?');
      values.push(data.payment_status);
    }
    if (data.service_visits !== undefined) {
      fields.push('service_visits = ?');
      values.push(data.service_visits);
    }
    if (data.completed_visits !== undefined) {
      fields.push('completed_visits = ?');
      values.push(data.completed_visits);
    }
    if (data.cleaning_included !== undefined) {
      fields.push('cleaning_included = ?');
      values.push(data.cleaning_included);
    }
    if (data.inspection_included !== undefined) {
      fields.push('inspection_included = ?');
      values.push(data.inspection_included);
    }
    if (data.repairs_included !== undefined) {
      fields.push('repairs_included = ?');
      values.push(data.repairs_included);
    }
    if (data.terms_conditions !== undefined) {
      fields.push('terms_conditions = ?');
      values.push(data.terms_conditions);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE amc_contracts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete AMC
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM amc_contracts WHERE id = ?', [id]);
  },
};

export const serviceTicketDb = {
  // Find all tickets
  findAll: async (options?: {
    project_id?: number;
    customer_id?: number;
    status?: ServiceTicketStatus;
    priority?: ServicePriority;
    assigned_to?: number;
    limit?: number;
    offset?: number;
  }): Promise<ServiceTicket[]> => {
    let sql = `
      SELECT st.*, p.project_id, c.name as customer_name, c.mobile as customer_mobile,
             u1.name as created_by_name, u2.name as assigned_to_name
      FROM service_tickets st
      LEFT JOIN projects p ON st.project_id = p.id
      LEFT JOIN customers c ON st.customer_id = c.id
      LEFT JOIN users u1 ON st.created_by = u1.id
      LEFT JOIN users u2 ON st.assigned_to = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.project_id) {
      sql += ' AND st.project_id = ?';
      params.push(options.project_id);
    }
    if (options?.customer_id) {
      sql += ' AND st.customer_id = ?';
      params.push(options.customer_id);
    }
    if (options?.status) {
      sql += ' AND st.status = ?';
      params.push(options.status);
    }
    if (options?.priority) {
      sql += ' AND st.priority = ?';
      params.push(options.priority);
    }
    if (options?.assigned_to) {
      sql += ' AND st.assigned_to = ?';
      params.push(options.assigned_to);
    }

    sql += ' ORDER BY st.created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return query<ServiceTicket>(sql, params);
  },

  // Find by ID
  findById: async (id: number): Promise<ServiceTicket | null> => {
    return queryOne<ServiceTicket>(
      `SELECT st.*, p.project_id, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address,
              u1.name as created_by_name, u2.name as assigned_to_name
       FROM service_tickets st
       LEFT JOIN projects p ON st.project_id = p.id
       LEFT JOIN customers c ON st.customer_id = c.id
       LEFT JOIN users u1 ON st.created_by = u1.id
       LEFT JOIN users u2 ON st.assigned_to = u2.id
       WHERE st.id = ?`,
      [id]
    );
  },

  // Find by ticket number
  findByNumber: async (ticketNumber: string): Promise<ServiceTicket | null> => {
    return queryOne<ServiceTicket>('SELECT * FROM service_tickets WHERE ticket_number = ?', [ticketNumber]);
  },

  // Generate ticket number
  generateNumber: async (): Promise<string> => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const count = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM service_tickets WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
      [year, new Date().getMonth() + 1]
    );
    const seq = (count?.count || 0) + 1;
    return `TKT-${year}${month}-${seq.toString().padStart(4, '0')}`;
  },

  // Create ticket
  create: async (data: Omit<ServiceTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at' | 'created_by_user' | 'assigned_to_user' | 'project' | 'customer'>, userId: number): Promise<number> => {
    const ticketNumber = await serviceTicketDb.generateNumber();
    return insert(
      `INSERT INTO service_tickets (ticket_number, project_id, customer_id, issue_category, issue_type,
       priority, description, assigned_to, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketNumber,
        data.project_id || null,
        data.customer_id || null,
        data.issue_category || null,
        data.issue_type || null,
        data.priority || null,
        data.description || null,
        data.assigned_to || null,
        data.status || 'OPEN',
        userId,
      ]
    );
  },

  // Update ticket
  update: async (id: number, data: Partial<Omit<ServiceTicket, 'id' | 'ticket_number' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_user' | 'assigned_to_user' | 'project' | 'customer'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.issue_category) {
      fields.push('issue_category = ?');
      values.push(data.issue_category);
    }
    if (data.issue_type) {
      fields.push('issue_type = ?');
      values.push(data.issue_type);
    }
    if (data.priority) {
      fields.push('priority = ?');
      values.push(data.priority);
    }
    if (data.description) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.assigned_to !== undefined) {
      fields.push('assigned_to = ?');
      values.push(data.assigned_to);
    }
    if (data.resolution !== undefined) {
      fields.push('resolution = ?');
      values.push(data.resolution);
    }
    if (data.resolved_at !== undefined) {
      fields.push('resolved_at = ?');
      values.push(data.resolved_at);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
      // Auto-set resolved_at when status is RESOLVED
      if (data.status === 'RESOLVED' && !data.resolved_at) {
        fields.push('resolved_at = CURRENT_TIMESTAMP');
      }
    }
    if (data.customer_rating !== undefined) {
      fields.push('customer_rating = ?');
      values.push(data.customer_rating);
    }
    if (data.customer_feedback !== undefined) {
      fields.push('customer_feedback = ?');
      values.push(data.customer_feedback);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE service_tickets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete ticket
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM service_tickets WHERE id = ?', [id]);
  },

  // Get ticket statistics
  getStats: async (options?: { project_id?: number; customer_id?: number }): Promise<{
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    high_priority: number;
    overdue: number;
  }> => {
    let sql = 'SELECT';
    const params: any[] = [];

    if (options?.project_id) {
      sql += ' (SELECT COUNT(*) FROM service_tickets WHERE project_id = ? AND status = ?) as open,';
      params.push(options.project_id, 'OPEN');
      // ... similar for other stats
      return (await queryOne(sql, params)) || { open: 0, in_progress: 0, resolved: 0, closed: 0, high_priority: 0, overdue: 0 };
    }

    const result = await queryOne<any>(
      `SELECT
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN priority IN ('HIGH', 'URGENT') AND status NOT IN ('CLOSED', 'RESOLVED') THEN 1 ELSE 0 END) as high_priority,
        SUM(CASE WHEN status NOT IN ('CLOSED', 'RESOLVED') AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as overdue
      FROM service_tickets`
    );

    return result || { open: 0, in_progress: 0, resolved: 0, closed: 0, high_priority: 0, overdue: 0 };
  },
};

export const serviceVisitDb = {
  // Find all visits
  findAll: async (options?: {
    service_ticket_id?: number;
    amc_contract_id?: number;
    technician_id?: number;
    from_date?: Date;
    to_date?: Date;
  }): Promise<ServiceVisit[]> => {
    let sql = `
      SELECT sv.*, u.name as technician_name
      FROM service_visits sv
      LEFT JOIN users u ON sv.technician_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.service_ticket_id) {
      sql += ' AND sv.service_ticket_id = ?';
      params.push(options.service_ticket_id);
    }
    if (options?.amc_contract_id) {
      sql += ' AND sv.amc_contract_id = ?';
      params.push(options.amc_contract_id);
    }
    if (options?.technician_id) {
      sql += ' AND sv.technician_id = ?';
      params.push(options.technician_id);
    }
    if (options?.from_date) {
      sql += ' AND sv.visit_date >= ?';
      params.push(options.from_date);
    }
    if (options?.to_date) {
      sql += ' AND sv.visit_date <= ?';
      params.push(options.to_date);
    }

    sql += ' ORDER BY sv.visit_date DESC, sv.created_at DESC';

    return query<ServiceVisit>(sql, params);
  },

  // Create visit
  create: async (data: Omit<ServiceVisit, 'id' | 'created_at' | 'updated_at' | 'technician'>): Promise<number> => {
    return insert(
      `INSERT INTO service_visits (service_ticket_id, amc_contract_id, visit_date, technician_id, start_time, end_time,
       work_performed, parts_used, findings, latitude, longitude, customer_signature_path, customer_name, customer_remarks,
       before_photos, after_photos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.service_ticket_id || null,
        data.amc_contract_id || null,
        data.visit_date,
        data.technician_id,
        data.start_time || null,
        data.end_time || null,
        data.work_performed || null,
        data.parts_used ? JSON.stringify(data.parts_used) : null,
        data.findings || null,
        data.latitude || null,
        data.longitude || null,
        data.customer_signature_path || null,
        data.customer_name || null,
        data.customer_remarks || null,
        data.before_photos ? JSON.stringify(data.before_photos) : null,
        data.after_photos ? JSON.stringify(data.after_photos) : null,
      ]
    );
  },

  // Update visit
  update: async (id: number, data: Partial<Omit<ServiceVisit, 'id' | 'service_ticket_id' | 'amc_contract_id' | 'created_at' | 'updated_at' | 'technician'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.visit_date) {
      fields.push('visit_date = ?');
      values.push(data.visit_date);
    }
    if (data.start_time !== undefined) {
      fields.push('start_time = ?');
      values.push(data.start_time);
    }
    if (data.end_time !== undefined) {
      fields.push('end_time = ?');
      values.push(data.end_time);
    }
    if (data.work_performed !== undefined) {
      fields.push('work_performed = ?');
      values.push(data.work_performed);
    }
    if (data.parts_used !== undefined) {
      fields.push('parts_used = ?');
      values.push(data.parts_used ? JSON.stringify(data.parts_used) : null);
    }
    if (data.findings !== undefined) {
      fields.push('findings = ?');
      values.push(data.findings);
    }
    if (data.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(data.latitude);
    }
    if (data.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(data.longitude);
    }
    if (data.customer_signature_path !== undefined) {
      fields.push('customer_signature_path = ?');
      values.push(data.customer_signature_path);
    }
    if (data.customer_name !== undefined) {
      fields.push('customer_name = ?');
      values.push(data.customer_name);
    }
    if (data.customer_remarks !== undefined) {
      fields.push('customer_remarks = ?');
      values.push(data.customer_remarks);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE service_visits SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },
};
