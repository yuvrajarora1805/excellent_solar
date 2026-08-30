import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.6',
    version_code: 15,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Customer Project Dropdown to Quotation Generator\n• Auto-fills location and capacity for selected customers\n• Quotation manual total cost override improvements',
  });
}


