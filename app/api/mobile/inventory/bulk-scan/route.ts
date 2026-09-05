import { NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
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
        userId = decoded.id || decoded.sub;
      } catch (error) {}
    }

    const session = await auth();
    const finalUserId = userId || session?.user?.id;

    if (!finalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Valid items array is required' },
        { status: 400 }
      );
    }

    return await transaction(async (connection) => {
      let successCount = 0;
      const errors = [];

      for (const item of items) {
        const { model_number, serial_number } = item;

        if (!model_number || !serial_number) {
          errors.push({ item, error: 'Missing model or serial number' });
          continue;
        }

        const [products] = await connection.query(
          'SELECT id FROM products WHERE model = ? OR product_code = ? LIMIT 1',
          [model_number, model_number]
        );
        
        const product = (products as any[])[0];

        if (!product) {
          errors.push({ item, error: 'Product model not found', code: 'PRODUCT_NOT_FOUND' });
          continue;
        }

        const [existingSerials] = await connection.query(
          'SELECT id FROM inventory_serials WHERE serial_number = ? LIMIT 1',
          [serial_number]
        );

        if ((existingSerials as any[]).length > 0) {
          errors.push({ item, error: 'Serial number already scanned' });
          continue;
        }

        await connection.query(
          'INSERT INTO inventory_serials (product_id, serial_number, status, added_by) VALUES (?, ?, ?, ?)',
          [product.id, serial_number, 'IN_STOCK', finalUserId]
        );

        await connection.query(
          'UPDATE products SET current_stock = current_stock + 1 WHERE id = ?',
          [product.id]
        );

        successCount++;
      }

      if (successCount === 0 && errors.length > 0) {
        // Rollback handled if we threw an error, but here we can just return failure
        const error: any = new Error('All scans failed');
        error.errorsPayload = errors;
        throw error;
      }

      return NextResponse.json({
        message: `Inventory added successfully: ${successCount} items`,
        success: true,
        successCount,
        errors,
      });
    });
  } catch (error: any) {
    console.error('Error in bulk inventory scan:', error);
    if (error.errorsPayload) {
      return NextResponse.json(
        { error: 'Bulk scan failed', message: error.message, errors: error.errorsPayload, success: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
