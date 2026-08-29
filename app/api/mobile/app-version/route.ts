import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.2',
    version_code: 11,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Fixed Jobs screen to hide Site Survey for Installation workers\n• Fixed Orders menu visibility',
  });
}


