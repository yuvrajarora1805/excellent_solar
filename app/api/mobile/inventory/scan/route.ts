import { NextResponse } from 'next/server';
import { query, queryOne, transaction } from '@/lib/db';
import { auth } from '@/lib/auth/config';

import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    let userId = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback_secret_for_development';
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id || decoded.sub; // Ensure we get the ID
      } catch (error) {}
    }

    const session = await auth();
    const finalUserId = userId || session?.user?.id;

    if (!finalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model_number, serial_number } = await req.json();

    if (!model_number || !serial_number) {
      return NextResponse.json(
        { error: 'Model number and serial number are required' },
        { status: 400 }
      );
    }

    return await transaction(async (connection) => {
      // Find the product by model number
      const [products] = await connection.query(
        'SELECT id FROM products WHERE model = ? OR product_code = ? LIMIT 1',
        [model_number, model_number]
      );
      
      const product = (products as any[])[0];

      if (!product) {
        return NextResponse.json(
          { error: 'Product model not found', code: 'PRODUCT_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Check if serial number already exists
      const [existingSerials] = await connection.query(
        'SELECT id FROM inventory_serials WHERE serial_number = ? LIMIT 1',
        [serial_number]
      );

      if ((existingSerials as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Serial number already scanned in inventory' },
          { status: 400 }
        );
      }

      // Insert into inventory_serials
      await connection.query(
        'INSERT INTO inventory_serials (product_id, serial_number, status, added_by) VALUES (?, ?, ?, ?)',
        [product.id, serial_number, 'IN_STOCK', finalUserId]
      );

      // Increment product current_stock
      await connection.query(
        'UPDATE products SET current_stock = current_stock + 1 WHERE id = ?',
        [product.id]
      );

      return NextResponse.json({
        message: 'Inventory added successfully',
        success: true,
      });
    });
  } catch (error: any) {
    console.error('Error scanning inventory:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
