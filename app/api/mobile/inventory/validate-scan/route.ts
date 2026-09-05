import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

    const { model_number, serial_number } = await req.json();

    if (!model_number || !serial_number) {
      return NextResponse.json(
        { error: 'Model number and serial number are required' },
        { status: 400 }
      );
    }

    // Check if model exists
    const existingProducts: any = await query(
      'SELECT id, name FROM products WHERE model = ? OR product_code = ? LIMIT 1',
      [model_number, model_number]
    );

    if (existingProducts.length === 0) {
      return NextResponse.json(
        { error: 'Product model not found', code: 'PRODUCT_NOT_FOUND', success: false },
        { status: 200 }
      );
    }

    // Check if serial already exists
    const existingSerials: any = await query(
      'SELECT id FROM inventory_serials WHERE serial_number = ? LIMIT 1',
      [serial_number]
    );

    if (existingSerials.length > 0) {
      return NextResponse.json(
        { error: 'Serial number already scanned in inventory', code: 'SERIAL_EXISTS', success: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Valid item',
      product_name: existingProducts[0].name || 'Unknown Product',
    });
  } catch (error: any) {
    console.error('Error validating scan:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
