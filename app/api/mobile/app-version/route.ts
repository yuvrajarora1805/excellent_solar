import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.9',
    version_code: 42,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed issue where adding existing items duplicated lines instead of increasing quantity\n• Fixed tab bar text clipping on My Drafts screen',
  });
}
