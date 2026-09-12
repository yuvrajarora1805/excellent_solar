import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.8',
    version_code: 41,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed customer name missing in drafts list\n• Fixed customer name field missing when resuming draft\n• Fixed issue preventing items from loading when resuming drafted orders',
  });
}
