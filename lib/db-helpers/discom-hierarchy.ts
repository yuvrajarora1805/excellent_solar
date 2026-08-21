import { query, queryOne, insert, execute } from '@/lib/db';
import type { DiscomMaster, DiscomDivision, DiscomSubdivision, DiscomContact } from '@/types';

export const discomMasterDb = {
  findAll: async (options?: { state?: string; status?: string }): Promise<DiscomMaster[]> => {
    let sql = 'SELECT * FROM discom_masters WHERE 1=1';
    const params: any[] = [];

    if (options?.state) {
      sql += ' AND state = ?';
      params.push(options.state);
    }
    if (options?.status) {
      sql += ' AND status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY name ASC';
    return query<DiscomMaster>(sql, params);
  },

  findById: async (id: number): Promise<DiscomMaster | null> => {
    return queryOne<DiscomMaster>('SELECT * FROM discom_masters WHERE id = ?', [id]);
  },

  findByCode: async (code: string): Promise<DiscomMaster | null> => {
    return queryOne<DiscomMaster>('SELECT * FROM discom_masters WHERE code = ?', [code]);
  },

  create: async (data: Omit<DiscomMaster, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    return insert(
      'INSERT INTO discom_masters (code, name, state, website, portal_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      [data.code, data.name, data.state || null, data.website || null, data.portal_url || null, data.status]
    );
  },

  update: async (id: number, data: Partial<Omit<DiscomMaster, 'id' | 'created_at' | 'updated_at'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.state !== undefined) {
      fields.push('state = ?');
      values.push(data.state);
    }
    if (data.website !== undefined) {
      fields.push('website = ?');
      values.push(data.website);
    }
    if (data.portal_url !== undefined) {
      fields.push('portal_url = ?');
      values.push(data.portal_url);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(`UPDATE discom_masters SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM discom_masters WHERE id = ?', [id]);
  },
};

export const discomDivisionDb = {
  findAll: async (options?: {
    discom_id?: number;
    district?: string;
    status?: string;
  }): Promise<DiscomDivision[]> => {
    let sql = `
      SELECT dd.*, dm.name as discom_name, dm.code as discom_code
      FROM discom_divisions dd
      LEFT JOIN discom_masters dm ON dd.discom_id = dm.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.discom_id) {
      sql += ' AND dd.discom_id = ?';
      params.push(options.discom_id);
    }
    if (options?.district) {
      sql += ' AND dd.district = ?';
      params.push(options.district);
    }
    if (options?.status) {
      sql += ' AND dd.status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY dd.name ASC';
    return query<DiscomDivision>(sql, params);
  },

  findById: async (id: number): Promise<DiscomDivision | null> => {
    return queryOne<DiscomDivision>(
      `SELECT dd.*, dm.name as discom_name, dm.code as discom_code
       FROM discom_divisions dd
       LEFT JOIN discom_masters dm ON dd.discom_id = dm.id
       WHERE dd.id = ?`,
      [id]
    );
  },

  create: async (data: Omit<DiscomDivision, 'id' | 'created_at' | 'updated_at' | 'discom'>): Promise<number> => {
    return insert(
      'INSERT INTO discom_divisions (discom_id, code, name, district, address, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.discom_id, data.code, data.name, data.district || null, data.address || null, data.phone || null, data.email || null, data.status]
    );
  },

  update: async (id: number, data: Partial<Omit<DiscomDivision, 'id' | 'discom_id' | 'created_at' | 'updated_at' | 'discom'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.code) {
      fields.push('code = ?');
      values.push(data.code);
    }
    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.district !== undefined) {
      fields.push('district = ?');
      values.push(data.district);
    }
    if (data.address !== undefined) {
      fields.push('address = ?');
      values.push(data.address);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(`UPDATE discom_divisions SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM discom_divisions WHERE id = ?', [id]);
  },
};

export const discomSubdivisionDb = {
  findAll: async (options?: {
    division_id?: number;
    status?: string;
  }): Promise<DiscomSubdivision[]> => {
    let sql = `
      SELECT ds.*, dd.name as division_name, dd.code as division_code
      FROM discom_subdivisions ds
      LEFT JOIN discom_divisions dd ON ds.division_id = dd.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.division_id) {
      sql += ' AND ds.division_id = ?';
      params.push(options.division_id);
    }
    if (options?.status) {
      sql += ' AND ds.status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY ds.name ASC';
    return query<DiscomSubdivision>(sql, params);
  },

  findById: async (id: number): Promise<DiscomSubdivision | null> => {
    return queryOne<DiscomSubdivision>(
      `SELECT ds.*, dd.name as division_name, dd.code as division_code
       FROM discom_subdivisions ds
       LEFT JOIN discom_divisions dd ON ds.division_id = dd.id
       WHERE ds.id = ?`,
      [id]
    );
  },

  create: async (data: Omit<DiscomSubdivision, 'id' | 'created_at' | 'updated_at' | 'division'>): Promise<number> => {
    return insert(
      'INSERT INTO discom_subdivisions (division_id, code, name, area_covered, office_address, phone, email, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [data.division_id, data.code, data.name, data.area_covered || null, data.office_address || null, data.phone || null, data.email || null, data.status]
    );
  },

  update: async (id: number, data: Partial<Omit<DiscomSubdivision, 'id' | 'division_id' | 'created_at' | 'updated_at' | 'division'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.code) {
      fields.push('code = ?');
      values.push(data.code);
    }
    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.area_covered !== undefined) {
      fields.push('area_covered = ?');
      values.push(data.area_covered);
    }
    if (data.office_address !== undefined) {
      fields.push('office_address = ?');
      values.push(data.office_address);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }

    if (fields.length === 0) return 0;

    values.push(id);
    return execute(`UPDATE discom_subdivisions SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM discom_subdivisions WHERE id = ?', [id]);
  },
};

export const discomContactDb = {
  findAll: async (options?: {
    subdivision_id?: number;
    contact_type?: string;
    status?: string;
  }): Promise<DiscomContact[]> => {
    let sql = `
      SELECT dc.*, ds.name as subdivision_name, ds.code as subdivision_code
      FROM discom_contacts dc
      LEFT JOIN discom_subdivisions ds ON dc.subdivision_id = ds.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (options?.subdivision_id) {
      sql += ' AND dc.subdivision_id = ?';
      params.push(options.subdivision_id);
    }
    if (options?.contact_type) {
      sql += ' AND dc.contact_type = ?';
      params.push(options.contact_type);
    }
    if (options?.status) {
      sql += ' AND dc.status = ?';
      params.push(options.status);
    }

    sql += ' ORDER BY dc.contact_type ASC, dc.name ASC';
    return query<DiscomContact>(sql, params);
  },

  findById: async (id: number): Promise<DiscomContact | null> => {
    return queryOne<DiscomContact>(
      `SELECT dc.*, ds.name as subdivision_name, ds.code as subdivision_code
       FROM discom_contacts dc
       LEFT JOIN discom_subdivisions ds ON dc.subdivision_id = ds.id
       WHERE dc.id = ?`,
      [id]
    );
  },

  create: async (data: Omit<DiscomContact, 'id' | 'created_at' | 'updated_at' | 'subdivision'>): Promise<number> => {
    return insert(
      'INSERT INTO discom_contacts (subdivision_id, contact_type, name, designation, phone, mobile, email, area, status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [data.subdivision_id || null, data.contact_type, data.name, data.designation || null, data.phone || null, data.mobile || null, data.email || null, data.area || null, data.status, data.remarks || null]
    );
  },

  update: async (id: number, data: Partial<Omit<DiscomContact, 'id' | 'created_at' | 'updated_at' | 'subdivision'>>): Promise<number> => {
    const fields: string[] = [];
    const values: any[] = [];

    if (data.subdivision_id !== undefined) {
      fields.push('subdivision_id = ?');
      values.push(data.subdivision_id);
    }
    if (data.contact_type) {
      fields.push('contact_type = ?');
      values.push(data.contact_type);
    }
    if (data.name) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.designation !== undefined) {
      fields.push('designation = ?');
      values.push(data.designation);
    }
    if (data.phone !== undefined) {
      fields.push('phone = ?');
      values.push(data.phone);
    }
    if (data.mobile !== undefined) {
      fields.push('mobile = ?');
      values.push(data.mobile);
    }
    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.area !== undefined) {
      fields.push('area = ?');
      values.push(data.area);
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
    return execute(`UPDATE discom_contacts SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: async (id: number): Promise<number> => {
    return execute('DELETE FROM discom_contacts WHERE id = ?', [id]);
  },
};
