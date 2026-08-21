import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/users - List all users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let sql = 'SELECT id, name, email, role, mobile, active, created_at FROM users';
    const params: any[] = [];

    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    
    sql += ' ORDER BY created_at DESC';

    const users = await query(sql, params);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check if email exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [data.email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const bcrypt = require('bcryptjs');
    const plainPassword = data.password || '123456';
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    
    const result = await query(
      'INSERT INTO users (name, email, role, mobile, active, password) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.email, data.role, data.mobile || null, data.active ?? true, hashedPassword]
    ) as any;

    return NextResponse.json({ 
      id: result.insertId,
      name: data.name,
      email: data.email,
      role: data.role
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
