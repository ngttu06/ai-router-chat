'use client';
import { useState, useEffect } from 'react';
import { Loader2, Save, Info } from 'lucide-react';
import { adminFetchSettings, adminUpdateSettings } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetchSettings()
      .then((data: any[]) => {
        const obj: Record<string, string> = {};
        const desc: Record<string, string> = {};
        data.forEach(s => { obj[s.key] = s.value; desc[s.key] = s.description || ''; });
        setSettings(obj);
        setDescriptions(desc);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" /></div>;
  }

  const settingKeys = Object.keys(settings).sort();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold">App Settings</h3>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {settingKeys.map(key => (
            <div key={key} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium font-mono">{key}</label>
                {descriptions[key] && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{descriptions[key]}</p>
                )}
              </div>
              <div className="sm:w-80">
                {key.includes('enabled') || key.includes('_active') ? (
                  <button
                    onClick={() => setSettings(s => ({ ...s, [key]: s[key] === 'true' ? 'false' : 'true' }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] === 'true' ? 'bg-emerald-500' : 'bg-[hsl(var(--muted))]'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings[key] === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                ) : (
                  <input
                    value={settings[key] || ''}
                    onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-mono"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? 'Đã lưu!' : 'Lưu cài đặt'}
        </button>
      </div>
    </div>
  );
}
