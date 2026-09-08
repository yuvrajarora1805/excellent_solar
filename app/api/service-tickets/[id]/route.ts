import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { serviceTicketDb } from '@/lib/db-helpers/service';
import { execute } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const body = await request.json();

    if (body.status) {
      await serviceTicketDb.update(id, { status: body.status, resolution: body.resolution });
    }
    
    if (body.payment_status) {
      await execute('UPDATE service_tickets SET payment_status = ? WHERE id = ?', [body.payment_status, id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating service ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to update ticket' }, { status: 500 });
  }
}
