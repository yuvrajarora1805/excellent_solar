import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.11.4',
    version_code: 27,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Scan items now validate instantly and move errors to top\n• Added fully-featured "Add Product" form in dashboard\n• Added red highlight for failed bulk scan items\n• Improved product creation workflow on scan\n• Added robust 401 handling & automatic logout',
  });
}
