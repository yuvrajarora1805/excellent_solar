import { NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';
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

    const { product_code, name, category, brand, model } = await req.json();

    if (!product_code || !name || !category || !model) {
      return NextResponse.json(
        { error: 'Product code, name, category, and model are required' },
        { status: 400 }
      );
    }

    // Check if product code already exists
    const [existing] = await query(
      'SELECT id FROM products WHERE product_code = ? LIMIT 1',
      [product_code]
    );

    if (existing) {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 400 }
      );
    }

    // Ensure category exists
    const [existingCategory] = await query(
      'SELECT id FROM product_categories WHERE name = ? LIMIT 1',
      [category]
    );

    if (!existingCategory) {
      await insert(
        'INSERT INTO product_categories (name, description) VALUES (?, ?)',
        [category, `Auto-created category for ${category}`]
      );
    }

    // Insert new product
    await insert(
      'INSERT INTO products (product_code, name, category, brand, model, current_stock, reserved_stock, minimum_stock) VALUES (?, ?, ?, ?, ?, 0, 0, 5)',
      [product_code, name, category, brand || '', model]
    );

    return NextResponse.json({
      message: 'Product added successfully',
      success: true,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
