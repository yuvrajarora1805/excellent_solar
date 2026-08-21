import { query, insert, execute } from '@/lib/db';

export interface Reservation {
  id: number;
  project_id: number;
  product_id: number;
  quantity: number;
  status: 'RESERVED' | 'ISSUED' | 'RELEASED';
  reserved_by: number;
  notes?: string;
  reserved_at: string;
  // Joined fields
  product_name?: string;
  product_code?: string;
  category?: string;
  brand?: string;
  model?: string;
  unit?: string;
}

export const reservationDb = {
  // Get all grouped reservations for the global inventory page
  findAll: async (options?: { limit?: number; offset?: number }): Promise<any[]> => {
    // We need to fetch all reservations and group them by project
    // since the frontend expects grouped InventoryReservation structure
    const rows = await query<any>(
      `SELECT pr.*, 
              p.name as product_name, p.product_code, p.category, p.brand, p.model, p.unit,
              proj.project_id as project_id_str
       FROM project_reservations pr
       JOIN products p ON pr.product_id = p.id
       JOIN projects proj ON pr.project_id = proj.id
       ORDER BY pr.updated_at DESC`
    );

    const grouped = new Map<number, any>();

    for (const row of rows) {
      if (!grouped.has(row.project_id)) {
        grouped.set(row.project_id, {
          id: row.project_id, // Use project_id as the grouped ID
          reservation_number: `RES-${row.project_id_str || row.project_id}`,
          project_id: row.project_id,
          project_id_str: row.project_id_str || `Project #${row.project_id}`,
          reservation_date: row.updated_at || row.created_at || new Date().toISOString(),
          status: row.status, // We could compute an aggregate status here
          items: []
        });
      }

      const group = grouped.get(row.project_id);
      group.items.push({
        id: row.id,
        product_id: row.product_id,
        product_name: row.product_name || `Product #${row.product_id}`,
        requested_quantity: row.quantity,
        reserved_quantity: row.status === 'RESERVED' || row.status === 'ISSUED' ? row.quantity : 0,
        shortage_quantity: 0, // This could be calculated based on current_stock if needed
        status: row.status
      });

      // Update aggregate status
      if (row.status === 'RESERVED') {
        group.status = 'FULLY_RESERVED';
      }
    }

    let result = Array.from(grouped.values());
    
    if (options?.limit) {
      result = result.slice(options.offset || 0, (options.offset || 0) + options.limit);
    }
    
    return result;
  },

  // Get all reservations for a project
  findByProject: async (projectId: number): Promise<Reservation[]> => {
    return query<Reservation>(
      `SELECT pr.*, p.name as product_name, p.product_code, p.category, p.brand, p.model, p.unit
       FROM project_reservations pr
       JOIN products p ON pr.product_id = p.id
       WHERE pr.project_id = ?
       ORDER BY p.category, p.name`,
      [projectId]
    );
  },

  // Create reservations for a project (batch)
  createBatch: async (
    projectId: number,
    items: { product_id: number; quantity: number; notes?: string }[],
    reservedBy: number
  ): Promise<void> => {
    if (items.length === 0) return;

    for (const item of items) {
      if (!item.product_id || item.quantity <= 0) continue;

      // Check available stock
      const products = await query<any>(
        'SELECT current_stock, reserved_stock FROM products WHERE id = ? AND status = "Active"',
        [item.product_id]
      );
      if (!products.length) throw new Error(`Product ${item.product_id} not found`);

      const { current_stock, reserved_stock } = products[0];
      const available = current_stock - reserved_stock;
      if (available < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}. Available: ${available}, Requested: ${item.quantity}`);
      }

      // Insert/update reservation
      await execute(
        `INSERT INTO project_reservations (project_id, product_id, quantity, reserved_by, notes, status)
         VALUES (?, ?, ?, ?, ?, 'RESERVED')
         ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), status = 'RESERVED', updated_at = NOW()`,
        [projectId, item.product_id, item.quantity, reservedBy, item.notes || null]
      );

      // Increment reserved_stock
      await execute(
        'UPDATE products SET reserved_stock = reserved_stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
  },

  // Issue reservations when installation starts
  issue: async (projectId: number): Promise<void> => {
    const reservations = await query<Reservation>(
      'SELECT * FROM project_reservations WHERE project_id = ? AND status = "RESERVED"',
      [projectId]
    );
    for (const r of reservations) {
      await execute(
        'UPDATE project_reservations SET status = "ISSUED", updated_at = NOW() WHERE id = ?',
        [r.id]
      );
      await execute(
        'UPDATE products SET current_stock = current_stock - ?, reserved_stock = reserved_stock - ? WHERE id = ?',
        [r.quantity, r.quantity, r.product_id]
      );
    }
  },

  // Release all reservations for a project
  releaseAll: async (projectId: number): Promise<void> => {
    const reservations = await query<Reservation>(
      'SELECT * FROM project_reservations WHERE project_id = ? AND status = "RESERVED"',
      [projectId]
    );
    for (const r of reservations) {
      await execute(
        'UPDATE project_reservations SET status = "RELEASED", updated_at = NOW() WHERE id = ?',
        [r.id]
      );
      await execute(
        'UPDATE products SET reserved_stock = GREATEST(0, reserved_stock - ?) WHERE id = ?',
        [r.quantity, r.product_id]
      );
    }
  },

  // Release a single reservation
  releaseOne: async (reservationId: number): Promise<void> => {
    const rows = await query<Reservation>(
      'SELECT * FROM project_reservations WHERE id = ? AND status = "RESERVED"',
      [reservationId]
    );
    if (!rows.length) return;
    const r = rows[0];
    await execute(
      'UPDATE project_reservations SET status = "RELEASED", updated_at = NOW() WHERE id = ?',
      [reservationId]
    );
    await execute(
      'UPDATE products SET reserved_stock = GREATEST(0, reserved_stock - ?) WHERE id = ?',
      [r.quantity, r.product_id]
    );
  },

  // Stub methods to satisfy api/reservations routes
  findById: async (id: number): Promise<any> => {
    const rows = await query('SELECT * FROM project_reservations WHERE id = ?', [id]);
    return (rows as any[])[0] || null;
  },
  create: async (data: any, createdBy: number): Promise<number> => {
    return 0; // Stub
  },
  update: async (id: number, data: any): Promise<void> => {},
  delete: async (id: number): Promise<void> => {},
  reserveItems: async (id: number): Promise<void> => {},
  release: async (id: number): Promise<void> => {},
};
