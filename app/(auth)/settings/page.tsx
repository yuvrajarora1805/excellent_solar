'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Database, Bell, Palette, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    system_name: 'Excellent Solar KKP',
    theme: 'system',
    notifications_email: 'true',
    notifications_sms: 'true',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Configure global preferences and system parameters</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>General System</CardTitle>
            </div>
            <CardDescription>Basic system configuration and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>System Name</Label>
              <Input 
                value={settings.system_name} 
                onChange={e => setSettings({...settings, system_name: e.target.value})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage how the system sends alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-slate-500">Send updates via email</p>
              </div>
              <select 
                className="rounded-md border p-2"
                value={settings.notifications_email}
                onChange={e => setSettings({...settings, notifications_email: e.target.value})}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-slate-500">Send critical alerts via SMS</p>
              </div>
              <select 
                className="rounded-md border p-2"
                value={settings.notifications_sms}
                onChange={e => setSettings({...settings, notifications_sms: e.target.value})}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-500" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize the system theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {['light', 'dark', 'system'].map((themeOption) => (
                <div 
                  key={themeOption}
                  onClick={() => setSettings({...settings, theme: themeOption})}
                  className={`p-4 border rounded-lg cursor-pointer text-center capitalize ${
                    settings.theme === themeOption ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-medium">{themeOption}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
