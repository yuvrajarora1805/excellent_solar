import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.10.0',
    version_code: 22,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Inventory Multi-Scan Support\n• Dynamic Product Creation\n• Role-based Navigation Tabs',
  });
}
