import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Mock settings if table doesn't exist
const defaultSettings = {
  theme: 'system',
  notifications_email: 'true',
  notifications_sms: 'true',
  system_name: 'Excellent Solar KKP',
};

// GET /api/settings - Fetch settings
export async function GET() {
  try {
    // Attempt to query settings if table exists
    try {
      const dbSettings = await query('SELECT * FROM system_settings');
      if (Array.isArray(dbSettings) && dbSettings.length > 0) {
         const settingsMap: Record<string, string> = {};
         dbSettings.forEach((s: any) => {
           settingsMap[s.setting_key] = s.setting_value;
         });
         return NextResponse.json({ ...defaultSettings, ...settingsMap });
      }
    } catch(err) {
      // Table might not exist, return defaults
      console.log('system_settings table may not exist, returning default settings');
    }
    
    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings - Update settings
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // In a real scenario, we'd update DB table
    try {
      for (const [key, value] of Object.entries(data)) {
        await query(
          'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
          [key, String(value), String(value)]
        );
      }
    } catch(err) {
       console.log('Could not update DB settings, table may not exist');
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
