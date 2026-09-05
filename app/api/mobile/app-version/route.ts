import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.11.2',
    version_code: 25,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added red highlight for failed bulk scan items\n• Improved product creation workflow on scan\n• Added robust 401 handling & automatic logout\n• Fixed background polling issues\n• Fixed category dropdown list matching web app',
  });
}
