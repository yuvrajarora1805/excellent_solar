import { NextRequest, NextResponse } from 'next/server';
import { installationDb } from '@/lib/db-helpers/installation';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const installations = await installationDb.findAll({ status });
    return NextResponse.json({ installations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch installations' }, { status: 500 });
  }
}
