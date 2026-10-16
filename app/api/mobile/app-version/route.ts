import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.15',
    version_code: 48,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed order creation & draft saving when scanning serials\n• Surface exact server errors on mobile\n• Safe product deletion and archiving in inventory',
  });
}
