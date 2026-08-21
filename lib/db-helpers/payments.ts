import { query, queryOne, insert, execute } from '@/lib/db';
import type { Payment, PaymentSchedule, PaymentMethod, PaymentStatus } from '@/types';

export const paymentScheduleDb = {
  // Find all schedules for a project
  findByProject: async (projectId: number): Promise<PaymentSchedule[]> => {
    return query<PaymentSchedule>(
      'SELECT * FROM payment_schedules WHERE project_id = ? ORDER BY installment_number ASC',
      [projectId]
    );
  },

  // Create payment schedule
  create: async (data: Omit<PaymentSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    return insert(
      'INSERT INTO payment_schedules (project_id, installment_number, installment_name, due_amount, due_date, status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.project_id, data.installment_number, data.installment_name, data.due_amount, data.due_date || null, data.status, data.remarks || null]
    );
  },

  // Update schedule
  update: async (id: number, data: Partial<Omit<PaymentSchedule, 'id' | 'project_id' | 'installment_number' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.installment_name) {
      fields.push('installment_name = ?');
      values.push(data.installment_name);
    }
    if (data.due_amount !== undefined) {
      fields.push('due_amount = ?');
      values.push(data.due_amount);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(data.remarks);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE payment_schedules SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete schedule
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM payment_schedules WHERE id = ?', [id]);
  },

  // Delete all schedules for a project
  deleteByProject: async (projectId: number): Promise<number> => {
    return execute('DELETE FROM payment_schedules WHERE project_id = ?', [projectId]);
  },
};

export const paymentDb = {
  // Find all payments
  findAll: async (options?: {
    project_id?: number;
    payment_method?: PaymentMethod;
    status?: PaymentStatus;
    from_date?: Date;
    to_date?: Date;
    limit?: number;
    offset?: number;
  }): Promise<Payment[]> => {
    let sql = `
      SELECT p.*, ps.installment_number, ps.installment_name,
             u.name as created_by_name, pr.project_id, c.name as customer_name
      FROM payments p
      LEFT JOIN payment_schedules ps ON p.payment_schedule_id = ps.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN projects pr ON p.project_id = pr.id
      LEFT JOIN customers c ON pr.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.project_id) {
      sql += ' AND p.project_id = ?';
      params.push(options.project_id);
    }
    if (options?.payment_method) {
      sql += ' AND p.payment_method = ?';
      params.push(options.payment_method);
    }
    if (options?.status) {
      sql += ' AND p.status = ?';
      params.push(options.status);
    }
    if (options?.from_date) {
      sql += ' AND p.payment_date >= ?';
      params.push(options.from_date);
    }
    if (options?.to_date) {
      sql += ' AND p.payment_date <= ?';
      params.push(options.to_date);
    }

    sql += ' ORDER BY p.payment_date DESC, p.created_at DESC';

    if (options?.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    return query<Payment>(sql, params);
  },

  // Find by ID
  findById: async (id: number): Promise<Payment | null> => {
    return queryOne<Payment>(
      `SELECT p.*, ps.installment_number, ps.installment_name,
              u.name as created_by_name, pr.project_id, c.name as customer_name
       FROM payments p
       LEFT JOIN payment_schedules ps ON p.payment_schedule_id = ps.id
       LEFT JOIN users u ON p.created_by = u.id
       LEFT JOIN projects pr ON p.project_id = pr.id
       LEFT JOIN customers c ON pr.customer_id = c.id
       WHERE p.id = ?`,
      [id]
    );
  },

  // Find by payment number
  findByNumber: async (paymentNumber: string): Promise<Payment | null> => {
    return queryOne<Payment>('SELECT * FROM payments WHERE payment_number = ?', [paymentNumber]);
  },

  // Generate payment number
  generateNumber: async (): Promise<string> => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const count = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM payments WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?',
      [year, new Date().getMonth() + 1]
    );
    const seq = (count?.count || 0) + 1;
    return `PAY-${year}${month}-${seq.toString().padStart(4, '0')}`;
  },

  // Create payment
  create: async (data: Omit<Payment, 'id' | 'payment_number' | 'created_at' | 'updated_at'>, userId: number): Promise<number> => {
    const paymentNumber = await paymentDb.generateNumber();
    return insert(
      `INSERT INTO payments (payment_number, project_id, payment_schedule_id, payment_date, amount, payment_method,
       transaction_number, cheque_number, bank_name, reference_person, receipt_path, status, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentNumber,
        data.project_id,
        data.payment_schedule_id || null,
        data.payment_date,
        data.amount,
        data.payment_method,
        data.transaction_number || null,
        data.cheque_number || null,
        data.bank_name || null,
        data.reference_person || null,
        data.receipt_path || null,
        data.status,
        data.remarks || null,
        userId,
      ]
    );
  },

  // Update payment
  update: async (id: number, data: Partial<Omit<Payment, 'id' | 'payment_number' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.payment_date) {
      fields.push('payment_date = ?');
      values.push(data.payment_date);
    }
    if (data.amount !== undefined) {
      fields.push('amount = ?');
      values.push(data.amount);
    }
    if (data.payment_method) {
      fields.push('payment_method = ?');
      values.push(data.payment_method);
    }
    if (data.transaction_number !== undefined) {
      fields.push('transaction_number = ?');
      values.push(data.transaction_number);
    }
    if (data.cheque_number !== undefined) {
      fields.push('cheque_number = ?');
      values.push(data.cheque_number);
    }
    if (data.bank_name !== undefined) {
      fields.push('bank_name = ?');
      values.push(data.bank_name);
    }
    if (data.reference_person !== undefined) {
      fields.push('reference_person = ?');
      values.push(data.reference_person);
    }
    if (data.receipt_path !== undefined) {
      fields.push('receipt_path = ?');
      values.push(data.receipt_path);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.remarks !== undefined) {
      fields.push('remarks = ?');
      values.push(data.remarks);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Delete payment
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM payments WHERE id = ?', [id]);
  },

  // Get payment summary for a project
  getProjectSummary: async (projectId: number): Promise<{
    total_due: number;
    total_paid: number;
    balance: number;
    payments: Payment[];
  }> => {
    const schedules = await query<PaymentSchedule>(
      'SELECT * FROM payment_schedules WHERE project_id = ? ORDER BY installment_number ASC',
      [projectId]
    );

    const payments = await query<Payment>(
      'SELECT * FROM payments WHERE project_id = ? AND status = ? ORDER BY payment_date ASC',
      [projectId, 'COMPLETED']
    );

    const totalDue = schedules.reduce((sum, s) => sum + s.due_amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      total_due: totalDue,
      total_paid: totalPaid,
      balance: totalDue - totalPaid,
      payments,
    };
  },
};
