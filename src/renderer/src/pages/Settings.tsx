import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { AppSettings } from '@shared/types';
import { Save } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
      officeName: '',
      address: '',
      phone: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
      window.api.getSettings().then(setSettings);
  }, []);

  const handleChange = (key: keyof AppSettings, value: string) => {
      setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
      await window.api.saveSettings(settings);
      setMsg('Settings Saved!');
      setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <Card>
          <CardHeader>
              <CardTitle>Office Information</CardTitle>
              <CardDescription>These details will appear on printed invoices.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label>Office Name</Label>
                  <Input value={settings.officeName} onChange={e => handleChange('officeName', e.target.value)} placeholder="My Exchange Office" />
              </div>
              <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={settings.address} onChange={e => handleChange('address', e.target.value)} placeholder="123 Street Name, City" />
              </div>
              <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={settings.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+389 70 123 456" />
              </div>
          </CardContent>
          <CardFooter className="flex justify-between">
              <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" /> Save Settings
              </Button>
              {msg && <span className="text-green-600 font-medium animate-pulse">{msg}</span>}
          </CardFooter>
      </Card>
    </div>
  );
}