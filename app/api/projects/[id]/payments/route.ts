import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { paymentDb } from '@/lib/db-helpers/payments';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/projects/[id]/payments - Get payment summary for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const summary = await paymentDb.getProjectSummary(Number(id));

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    return NextResponse.json({ error: 'Failed to fetch payment summary' }, { status: 500 });
  }
}
