import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.9',
    version_code: 18,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Customer Directory screen\n• Bug fixes and improvements',
  });
}
