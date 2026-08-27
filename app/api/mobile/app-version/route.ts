import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.1',
    version_code: 2,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Fixed site survey verification workflow\n• Added pending work remarks support\n• Improved date formatting (DD/MM/YYYY)\n• Added user-specific job isolation\n• Integrated direct auto-installer link',
  });
}
