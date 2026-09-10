import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.0',
    version_code: 33,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Admin users now get a clean hamburger (☰) side drawer — Dashboard, Jobs, Tickets & Orders remain in the bottom bar while DISCOM, Inventory, Booking and Profile move into the drawer\n• New Customer Booking form now supports Retail Dealer type — site photo & PSPCL grid details are hidden for retail customers\n• General mobile UI improvements and layout optimisations',
  });
}
