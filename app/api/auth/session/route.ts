import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      mobile: session.user.mobile,
    },
  });
}
