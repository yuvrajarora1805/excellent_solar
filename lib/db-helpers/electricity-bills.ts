import { query, queryOne, insert, execute } from '@/lib/db';
import type { ElectricityBill } from '@/types';

export const electricityBillDb = {
  // Find all bills
  findAll: async (options?: {
    customer_id?: number;
    project_id?: number;
    account_number?: string;
    is_verified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ElectricityBill[]> => {
    let sql = `
      SELECT eb.*, c.name as customer_name, c.mobile as customer_mobile,
             u.name as verified_by_name
      FROM electricity_bills eb
      LEFT JOIN customers c ON eb.customer_id = c.id
      LEFT JOIN users u ON eb.verified_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.customer_id) {
      sql += ' AND eb.customer_id = ?';
      params.push(options.customer_id);
    }
    if (options?.project_id) {
      sql += ' AND eb.project_id = ?';
      params.push(options.project_id);
    }
    if (options?.account_number) {
      sql += ' AND eb.account_number = ?';
      params.push(options.account_number);
    }
    if (options?.is_verified !== undefined) {
      sql += ' AND eb.is_verified = ?';
      params.push(options.is_verified);
    }

    sql += ' ORDER BY eb.created_at DESC';

    if (options?.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    return query<ElectricityBill>(sql, params);
  },

  // Find by ID
  findById: async (id: number): Promise<ElectricityBill | null> => {
    return queryOne<ElectricityBill>(
      `SELECT eb.*, c.name as customer_name, c.mobile as customer_mobile,
              u.name as verified_by_name
       FROM electricity_bills eb
       LEFT JOIN customers c ON eb.customer_id = c.id
       LEFT JOIN users u ON eb.verified_by = u.id
       WHERE eb.id = ?`,
      [id]
    );
  },

  // Find by account number
  findByAccountNumber: async (accountNumber: string): Promise<ElectricityBill[]> => {
    return query<ElectricityBill>('SELECT * FROM electricity_bills WHERE account_number = ? ORDER BY bill_date DESC', [accountNumber]);
  },

  // Find latest bill for customer
  findLatestByCustomer: async (customerId: number): Promise<ElectricityBill | null> => {
    return queryOne<ElectricityBill>(
      'SELECT * FROM electricity_bills WHERE customer_id = ? ORDER BY bill_date DESC LIMIT 1',
      [customerId]
    );
  },

  // Create bill
  create: async (data: Omit<ElectricityBill, 'id' | 'created_at' | 'updated_at' | 'verified_by' | 'verified_at' | 'verified_by_name'>): Promise<number> => {
    return insert(
      `INSERT INTO electricity_bills (customer_id, project_id, account_number, consumer_number, consumer_name, bill_address,
       discom, division, subdivision, sanctioned_load, connected_load, meter_number, phase, tariff_category,
       bill_date, due_date, bill_amount, units_consumed, file_path, file_name, ocr_extracted, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customer_id,
        data.project_id || null,
        data.account_number || null,
        data.consumer_number || null,
        data.consumer_name || null,
        data.bill_address || null,
        data.discom || null,
        data.division || null,
        data.subdivision || null,
        data.sanctioned_load || null,
        data.connected_load || null,
        data.meter_number || null,
        data.phase || null,
        data.tariff_category || null,
        data.bill_date || null,
        data.due_date || null,
        data.bill_amount || null,
        data.units_consumed || null,
        data.file_path || null,
        data.file_name || null,
        data.ocr_extracted ? JSON.stringify(data.ocr_extracted) : null,
        data.is_verified,
      ]
    );
  },

  // Update bill
  update: async (id: number, data: Partial<Omit<ElectricityBill, 'id' | 'customer_id' | 'project_id' | 'created_at' | 'updated_at' | 'verified_by_name'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.account_number !== undefined) {
      fields.push('account_number = ?');
      values.push(data.account_number);
    }
    if (data.consumer_number !== undefined) {
      fields.push('consumer_number = ?');
      values.push(data.consumer_number);
    }
    if (data.consumer_name !== undefined) {
      fields.push('consumer_name = ?');
      values.push(data.consumer_name);
    }
    if (data.bill_address !== undefined) {
      fields.push('bill_address = ?');
      values.push(data.bill_address);
    }
    if (data.discom !== undefined) {
      fields.push('discom = ?');
      values.push(data.discom);
    }
    if (data.division !== undefined) {
      fields.push('division = ?');
      values.push(data.division);
    }
    if (data.subdivision !== undefined) {
      fields.push('subdivision = ?');
      values.push(data.subdivision);
    }
    if (data.sanctioned_load !== undefined) {
      fields.push('sanctioned_load = ?');
      values.push(data.sanctioned_load);
    }
    if (data.connected_load !== undefined) {
      fields.push('connected_load = ?');
      values.push(data.connected_load);
    }
    if (data.meter_number !== undefined) {
      fields.push('meter_number = ?');
      values.push(data.meter_number);
    }
    if (data.phase !== undefined) {
      fields.push('phase = ?');
      values.push(data.phase);
    }
    if (data.tariff_category !== undefined) {
      fields.push('tariff_category = ?');
      values.push(data.tariff_category);
    }
    if (data.bill_date !== undefined) {
      fields.push('bill_date = ?');
      values.push(data.bill_date);
    }
    if (data.due_date !== undefined) {
      fields.push('due_date = ?');
      values.push(data.due_date);
    }
    if (data.bill_amount !== undefined) {
      fields.push('bill_amount = ?');
      values.push(data.bill_amount);
    }
    if (data.units_consumed !== undefined) {
      fields.push('units_consumed = ?');
      values.push(data.units_consumed);
    }
    if (data.file_path !== undefined) {
      fields.push('file_path = ?');
      values.push(data.file_path);
    }
    if (data.file_name !== undefined) {
      fields.push('file_name = ?');
      values.push(data.file_name);
    }
    if (data.ocr_extracted !== undefined) {
      fields.push('ocr_extracted = ?');
      values.push(data.ocr_extracted ? JSON.stringify(data.ocr_extracted) : null);
    }
    if (data.is_verified !== undefined) {
      fields.push('is_verified = ?');
      values.push(data.is_verified);
    }
    if (data.verified_by !== undefined) {
      fields.push('verified_by = ?');
      values.push(data.verified_by);
      if (!data.verified_at) {
        fields.push('verified_at = CURRENT_TIMESTAMP');
      }
    }
    if (data.verified_at !== undefined) {
      fields.push('verified_at = ?');
      values.push(data.verified_at);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(
      `UPDATE electricity_bills SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // Verify bill
  verify: async (id: number, userId: number): Promise<number> => {
    return execute(
      'UPDATE electricity_bills SET is_verified = TRUE, verified_by = ?, verified_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId, id]
    );
  },

  // Delete bill
  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM electricity_bills WHERE id = ?', [id]);
  },
};
