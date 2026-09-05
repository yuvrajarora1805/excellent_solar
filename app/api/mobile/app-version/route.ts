import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.11.3',
    version_code: 26,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added fully-featured "Add Product" form in dashboard\n• Added red highlight for failed bulk scan items\n• Improved product creation workflow on scan\n• Added robust 401 handling & automatic logout',
  });
}
