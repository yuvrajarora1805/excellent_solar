import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await query(`
      ALTER TABLE service_tickets 
      ADD COLUMN IF NOT EXISTS service_type ENUM('FREE', 'PAID') DEFAULT 'FREE',
      ADD COLUMN IF NOT EXISTS payment_status ENUM('PENDING', 'PAID', 'NOT_APPLICABLE') DEFAULT 'NOT_APPLICABLE'
    `);
    return NextResponse.json({ success: true, message: 'Migration applied successfully' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
