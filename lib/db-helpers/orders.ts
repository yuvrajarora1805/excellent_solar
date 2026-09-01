import { query, queryOne, insert, execute, transaction } from '@/lib/db';

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface OrderSerial {
  id?: number;
  order_id?: number;
  product_id: number;
  serial_number: string;
  scanned_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'PROJECT' | 'RETAIL';
  customer_id?: number;
  customer_name: string;
  customer_mobile?: string;
  delivery_address?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_mobile?: string;
  vehicle_photo_path?: string;
  total_amount: number;
  status: 'DRAFT' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  created_by?: number;
  dispatched_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  serials?: OrderSerial[];
}

export const orderDb = {
  // Generate Order Number
  generateOrderNumber: async (): Promise<string> => {
    const year = new Date().getFullYear();
    const countRes = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM orders WHERE YEAR(created_at) = ?',
      [year]
    );
    const count = (countRes?.count || 0) + 1;
    return `ORD-${year}-${count.toString().padStart(4, '0')}`;
  },

  // Find all orders
  findAll: async (options?: {
    order_type?: 'PROJECT' | 'RETAIL';
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Order[]> => {
    let sql = `SELECT o.*, c.name as project_customer_name
               FROM orders o
               LEFT JOIN customers c ON o.customer_id = c.id
               WHERE 1=1`;
    const params: any[] = [];

    if (options?.order_type) {
      sql += ' AND o.order_type = ?';
      params.push(options.order_type);
    }

    if (options?.status) {
      sql += ' AND o.status = ?';
      params.push(options.status);
    }

    if (options?.search) {
      sql += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.vehicle_number LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }

    sql += ' ORDER BY o.created_at DESC';

    if (options?.limit) {
      sql += ` LIMIT ${Number(options.limit)}`;
      if (options.offset) {
        sql += ` OFFSET ${Number(options.offset)}`;
      }
    }

    return query<Order>(sql, params);
  },

  // Find order by ID with items & scanned panel serial numbers
  findById: async (id: number): Promise<Order | null> => {
    const order = await queryOne<Order>(
      `SELECT o.*, c.name as project_customer_name
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ?`,
      [id]
    );

    if (!order) return null;

    const items = await query<OrderItem>(
      `SELECT oi.*, p.name as product_name, p.product_code
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    const serials = await query<OrderSerial>(
      `SELECT os.*, p.name as product_name
       FROM order_serials os
       JOIN products p ON os.product_id = p.id
       WHERE os.order_id = ?`,
      [id]
    );

    return {
      ...order,
      items,
      serials,
    };
  },

  // Create Order with Items and Barcode-Scanned Serial Numbers
  create: async (data: {
    order_type: 'PROJECT' | 'RETAIL';
    customer_id?: number;
    customer_name: string;
    customer_mobile?: string;
    delivery_address?: string;
    vehicle_number?: string;
    driver_name?: string;
    driver_mobile?: string;
    vehicle_photo_path?: string;
    total_amount: number;
    items: Array<{ product_id: number; quantity: number; unit_price: number }>;
    serials: Array<{ product_id: number; serial_number: string }>;
    userId: number;
    dispatchImmediately?: boolean;
  }): Promise<number> => {
    return transaction(async (conn) => {
      const orderNumber = await orderDb.generateOrderNumber();
      const initialStatus = data.dispatchImmediately ? 'DISPATCHED' : 'READY_FOR_DISPATCH';

      const [res] = await conn.execute(
        `INSERT INTO orders (order_number, order_type, customer_id, customer_name, customer_mobile, delivery_address,
         vehicle_number, driver_name, driver_mobile, vehicle_photo_path, total_amount, status, created_by, dispatched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${data.dispatchImmediately ? 'NOW()' : 'NULL'})`,
        [
          orderNumber,
          data.order_type,
          data.customer_id || null,
          data.customer_name,
          data.customer_mobile || null,
          data.delivery_address || null,
          data.vehicle_number || null,
          data.driver_name || null,
          data.driver_mobile || null,
          data.vehicle_photo_path || null,
          data.total_amount,
          initialStatus,
          data.userId,
        ]
      );

      const orderId = (res as any).insertId;

      // Insert Order Line Items
      for (const item of data.items) {
        const lineTotal = item.quantity * item.unit_price;
        await conn.execute(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.unit_price, lineTotal]
        );
      }

      // Insert Scanned Serials & Update Stock if Dispatched
      for (const s of data.serials) {
        await conn.execute(
          `INSERT INTO order_serials (order_id, product_id, serial_number)
           VALUES (?, ?, ?)`,
          [orderId, s.product_id, s.serial_number]
        );

          // Update or Upsert Serial Status in Inventory to ISSUED
          await conn.execute(
            `INSERT INTO product_serial_numbers (product_id, serial_number, status, current_location, remarks)
             VALUES (?, ?, 'ISSUED', 'ISSUED', ?)
             ON DUPLICATE KEY UPDATE
                 status = 'ISSUED',
                 current_location = 'ISSUED',
                 remarks = CONCAT(COALESCE(remarks, ''), ' | Dispatched Order #${orderNumber} (${data.customer_name})')`,
            [s.product_id, s.serial_number, `Dispatched Order #${orderNumber} (${data.customer_name})`]
          );

      }

      // Sync stock if dispatched
      if (data.dispatchImmediately) {
        for (const item of data.items) {
          await conn.execute(
            'UPDATE products SET current_stock = GREATEST(0, current_stock - ?) WHERE id = ?',
            [item.quantity, item.product_id]
          );

          await conn.execute(
            `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, remarks, created_by)
             VALUES (?, 'ISSUE', ?, ?, 'ORDER_DISPATCH', ?, ?)`,
            [
              item.product_id,
              item.quantity,
              orderId,
              `Dispatched Order #${orderNumber} to ${data.customer_name} (Vehicle: ${data.vehicle_number || 'N/A'})`,
              data.userId,
            ]
          );
        }
      }

      return orderId;
    });
  },

  // Update Status to DISPATCHED or DELIVERED (Triggers Stock Sync)
  updateStatus: async (orderId: number, status: 'DISPATCHED' | 'DELIVERED' | 'CANCELLED', userId: number): Promise<void> => {
    return transaction(async (conn) => {
      const order = await orderDb.findById(orderId);
      if (!order) throw new Error('Order not found');

      if (status === 'DISPATCHED' && order.status !== 'DISPATCHED') {
        // Update Order
        await conn.execute(
          `UPDATE orders SET status = 'DISPATCHED', dispatched_at = NOW() WHERE id = ?`,
          [orderId]
        );

        // Update Serial Numbers Status to DISPATCHED
        if (order.serials) {
          for (const s of order.serials) {
            await conn.execute(
              `UPDATE product_serial_numbers
               SET status = 'ISSUED', current_location = 'ISSUED',
                   remarks = CONCAT(COALESCE(remarks, ''), ' | Dispatched Order #${order.order_number} to ${order.customer_name}')
               WHERE serial_number = ?`,
              [s.serial_number]
            );
          }
        }

        // Deduct Stock
        if (order.items) {
          for (const item of order.items) {
            await conn.execute(
              'UPDATE products SET current_stock = GREATEST(0, current_stock - ?) WHERE id = ?',
              [item.quantity, item.product_id]
            );

            await conn.execute(
              `INSERT INTO stock_transactions (product_id, type, quantity, reference_id, reference_type, remarks, created_by)
               VALUES (?, 'ISSUE', ?, ?, 'ORDER_DISPATCH', ?, ?)`,
              [
                item.product_id,
                item.quantity,
                orderId,
                `Dispatched Order #${order.order_number} to ${order.customer_name} (Vehicle: ${order.vehicle_number || 'N/A'})`,
                userId,
              ]
            );
          }
        }
      } else if (status === 'DELIVERED') {
        await conn.execute(
          `UPDATE orders SET status = 'DELIVERED', delivered_at = NOW() WHERE id = ?`,
          [orderId]
        );

        if (order.serials) {
          for (const s of order.serials) {
            await conn.execute(
              `UPDATE product_serial_numbers
               SET status = 'DELIVERED', current_location = 'DELIVERED',
                   remarks = CONCAT(COALESCE(remarks, ''), ' | Delivered Order #${order.order_number} to ${order.customer_name}')
               WHERE serial_number = ?`,
              [s.serial_number]
            );
          }
        }
      }
    });
  },

  // Update Order Items & Prices
  updateItems: async (orderId: number, items: Array<{ id?: number; product_id: number; quantity: number; unit_price: number }>): Promise<void> => {
    return transaction(async (conn) => {
      let newTotal = 0;
      for (const item of items) {
        const lineTotal = item.quantity * item.unit_price;
        newTotal += lineTotal;
        if (item.id) {
          await conn.execute(
            `UPDATE order_items SET quantity = ?, unit_price = ?, line_total = ? WHERE id = ? AND order_id = ?`,
            [item.quantity, item.unit_price, lineTotal, item.id, orderId]
          );
        } else {
          await conn.execute(
            `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)`,
            [orderId, item.product_id, item.quantity, item.unit_price, lineTotal]
          );
        }
      }
      await conn.execute(`UPDATE orders SET total_amount = ? WHERE id = ?`, [newTotal, orderId]);
    });
  },
};
