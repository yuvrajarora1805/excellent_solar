import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.8.1',
    version_code: 20,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed challan project linkage\n• Added double-dispatch prevention',
  });
}
