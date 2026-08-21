import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const users = await query('SELECT id, name, email, role, mobile, active FROM users WHERE id = ?', [id]) as any[];
    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(users[0]);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, email, role, mobile, password, active } = await request.json();

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await query(
        'UPDATE users SET name = ?, email = ?, role = ?, mobile = ?, password = ?, active = ? WHERE id = ?',
        [name, email, role, mobile, hashedPassword, active ? 1 : 0, id]
      );
    } else {
      await query(
        'UPDATE users SET name = ?, email = ?, role = ?, mobile = ?, active = ? WHERE id = ?',
        [name, email, role, mobile, active ? 1 : 0, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update user:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query('DELETE FROM users WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
