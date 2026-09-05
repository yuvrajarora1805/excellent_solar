import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    let userId = null;
    let role = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback_secret_for_development';
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id || decoded.sub;
        role = decoded.role;
      } catch (error) {}
    }

    const session = await auth();
    const finalUserId = userId || session?.user?.id;
    const finalRole = role || session?.user?.role;

    if (!finalUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (finalRole !== 'ADMIN' && finalRole !== 'INVENTORY_MANAGER') {
      return NextResponse.json({ error: 'Permission denied. Only Admins and Inventory Managers can create products.' }, { status: 403 });
    }

    const { model_number, category, name, brand, specification, minimum_stock } = await req.json();

    if (!model_number || !category) {
      return NextResponse.json(
        { error: 'Model number and category are required' },
        { status: 400 }
      );
    }

    const productCode = model_number.toUpperCase().replace(/\s+/g, '-');
    const productName = name || `${category} - ${model_number}`;

    const existingRows = await query('SELECT id FROM products WHERE model = ? OR product_code = ?', [model_number, productCode]);

    if (existingRows.length > 0) {
      return NextResponse.json(
        { error: 'Product with this model number already exists' },
        { status: 400 }
      );
    }

    await query(
      'INSERT INTO products (product_code, name, category, brand, model, specification, current_stock, reserved_stock, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)',
      [
        productCode,
        productName,
        category,
        brand || '',
        model_number,
        specification || '',
        minimum_stock || 10,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      model_number,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
