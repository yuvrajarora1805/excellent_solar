import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.11.0',
    version_code: 23,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed bulk inventory scan error handling\n• Improved product creation workflow on scan\n• Added robust 401 handling & automatic logout\n• Fixed background polling issues\n• Fixed auth logic in Login screen',
  });
}
