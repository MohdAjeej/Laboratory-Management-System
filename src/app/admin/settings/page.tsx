'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw, Building2, FileText, Hash, DollarSign, Bell, Cog } from 'lucide-react';

interface Setting {
  _id: string;
  key: string;
  category: string;
  value: any;
  description?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  { key: 'LAB_PROFILE', label: 'Lab Profile', icon: Building2, color: 'text-blue-600' },
  { key: 'REPORT_TEMPLATE', label: 'Report Template', icon: FileText, color: 'text-purple-600' },
  { key: 'NUMBERING', label: 'Numbering Format', icon: Hash, color: 'text-green-600' },
  { key: 'BILLING', label: 'Billing', icon: DollarSign, color: 'text-amber-600' },
  { key: 'NOTIFICATION', label: 'Notifications', icon: Bell, color: 'text-red-600' },
  { key: 'GENERAL', label: 'General', icon: Cog, color: 'text-gray-600' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('LAB_PROFILE');
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data.settings);
        const values: Record<string, any> = {};
        data.data.settings.forEach((s: Setting) => { values[s.key] = s.value; });
        setEditValues(values);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveSetting = async (setting: Setting) => {
    setSaving(setting.key);
    setSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: setting.key, value: editValues[setting.key], category: setting.category, description: setting.description }),
      });
      if (res.ok) {
        setSuccess(`${setting.key} saved!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch { /* ignore */ }
    setSaving(null);
  };

  const updateValue = (key: string, path: string, value: any) => {
    setEditValues(prev => {
      const updated = { ...prev };
      const obj = { ...updated[key] };
      const parts = path.split('.');
      let current: any = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      updated[key] = obj;
      return updated;
    });
  };

  const categorySettings = settings.filter(s => s.category === activeCategory);

  const renderValue = (setting: Setting) => {
    const val = editValues[setting.key] || {};

    if (setting.category === 'LAB_PROFILE') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="text-sm font-medium">Lab Name</label><Input value={val.name || ''} onChange={(e) => updateValue(setting.key, 'name', e.target.value)} /></div>
          <div className="col-span-2"><label className="text-sm font-medium">Tagline</label><Input value={val.tagline || ''} onChange={(e) => updateValue(setting.key, 'tagline', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Registration #</label><Input value={val.registrationNumber || ''} onChange={(e) => updateValue(setting.key, 'registrationNumber', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Phone</label><Input value={val.phone || ''} onChange={(e) => updateValue(setting.key, 'phone', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Email</label><Input value={val.email || ''} onChange={(e) => updateValue(setting.key, 'email', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Website</label><Input value={val.website || ''} onChange={(e) => updateValue(setting.key, 'website', e.target.value)} /></div>
        </div>
      );
    }

    if (setting.category === 'BILLING') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-sm font-medium">Tax Rate (%)</label><Input type="number" value={val.defaultTaxRate ?? 0} onChange={(e) => updateValue(setting.key, 'defaultTaxRate', Number(e.target.value))} /></div>
          <div><label className="text-sm font-medium">Tax Name</label><Input value={val.taxName || ''} onChange={(e) => updateValue(setting.key, 'taxName', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Currency</label><Input value={val.currency || ''} onChange={(e) => updateValue(setting.key, 'currency', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Symbol</label><Input value={val.currencySymbol || ''} onChange={(e) => updateValue(setting.key, 'currencySymbol', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Payment Terms</label><Input value={val.defaultPaymentTerms || ''} onChange={(e) => updateValue(setting.key, 'defaultPaymentTerms', e.target.value)} /></div>
          <div><label className="text-sm font-medium">Default Credit Limit</label><Input type="number" value={val.defaultCreditLimit ?? 0} onChange={(e) => updateValue(setting.key, 'defaultCreditLimit', Number(e.target.value))} /></div>
        </div>
      );
    }

    if (setting.category === 'NOTIFICATION') {
      return (
        <div className="space-y-3">
          {Object.entries(val).map(([key, enabled]) => (
            <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').replace('enable ', '').trim()}</span>
              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" checked={!!enabled} onChange={(e) => updateValue(setting.key, key, e.target.checked)} />
            </label>
          ))}
        </div>
      );
    }

    // Default: show as JSON textarea
    return (
      <textarea
        className="w-full h-40 font-mono text-sm border rounded-md p-3"
        value={JSON.stringify(val, null, 2)}
        onChange={(e) => {
          try { setEditValues(prev => ({ ...prev, [setting.key]: JSON.parse(e.target.value) })); } catch { /* invalid JSON */ }
        }}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure laboratory system preferences</p>
        </div>
        {success && <Badge className="bg-green-100 text-green-800">{success}</Badge>}
      </div>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div className="w-56 space-y-1">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                  activeCategory === cat.key ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className={`h-4 w-4 ${activeCategory === cat.key ? 'text-blue-600' : cat.color}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Settings content */}
        <div className="flex-1 space-y-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading settings...</div>
          ) : categorySettings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No settings configured for this category</p>
                <p className="text-sm text-gray-400 mt-1">Run the seed script to initialize default settings</p>
              </CardContent>
            </Card>
          ) : (
            categorySettings.map(setting => (
              <Card key={setting.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{setting.description || setting.key}</CardTitle>
                  <CardDescription className="font-mono text-xs">{setting.key}</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderValue(setting)}
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => saveSetting(setting)} disabled={saving === setting.key}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving === setting.key ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
