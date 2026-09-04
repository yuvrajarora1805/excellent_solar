import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { auth } from '@/lib/auth/config';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
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

    const categories = await query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category ASC');

    return NextResponse.json({
      success: true,
      categories: (categories as any[]).map(c => c.category),
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
