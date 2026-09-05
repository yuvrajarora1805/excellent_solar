import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.11.7',
    version_code: 30,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Changed "Solar Panels" labels to "Inventory Items" in dispatch scanner\n• Dispatch scanner now parses raw serial numbers accurately from manufacturer QR codes, bypassing the need for a model number\n• Order Dispatch can now seamlessly scan and dispatch products created locally through the mobile Inventory Scanner',
  });
}
