'use client';
import { useState, useEffect } from 'react';
import { Loader2, Save, Shield } from 'lucide-react';
import { adminFetchSettings, adminUpdateSettings } from '@/lib/api';

export default function AuthSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminFetchSettings()
      .then((data: any[]) => {
        const obj: Record<string, string> = {};
        data.forEach(s => { obj[s.key] = s.value; });
        setSettings(obj);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminUpdateSettings({
        google_client_id: settings.google_client_id || '',
        google_client_secret: settings.google_client_secret || '',
        google_enabled: settings.google_enabled || 'false',
        allowed_email_domains: settings.allowed_email_domains || '',
        registration_enabled: settings.registration_enabled || 'true',
        session_timeout_hours: settings.session_timeout_hours || '72',
      });
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

  return (
    <div className="space-y-6">
      {/* Google OAuth */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-semibold">Google OAuth 2.0</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Google Login</label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Cho phép user đăng nhập bằng tài khoản Google</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, google_enabled: s.google_enabled === 'true' ? 'false' : 'true' }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.google_enabled === 'true' ? 'bg-emerald-500' : 'bg-[hsl(var(--muted))]'}`}
            >
              <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.google_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium">Google Client ID</label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Lấy từ Google Cloud Console → APIs & Services → Credentials</p>
            <input
              value={settings.google_client_id || ''}
              onChange={e => setSettings(s => ({ ...s, google_client_id: e.target.value }))}
              placeholder="xxxx.apps.googleusercontent.com"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-mono"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Google Client Secret</label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Dùng cho OAuth redirect/code flow. Với Google One Tap hiện tại có thể để trống.</p>
            <input
              type="password"
              value={settings.google_client_secret || ''}
              onChange={e => setSettings(s => ({ ...s, google_client_secret: e.target.value }))}
              placeholder="GOCSPX-..."
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-mono"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Allowed Email Domains</label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Chỉ cho phép email từ các domain này (để trống = tất cả). Phân cách bằng dấu phẩy.</p>
            <input
              value={settings.allowed_email_domains || ''}
              onChange={e => setSettings(s => ({ ...s, allowed_email_domains: e.target.value }))}
              placeholder="gmail.com, company.com"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
        </div>
      </div>

      {/* Registration */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold">Registration</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Allow New User Registration</label>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Cho phép người dùng mới tự đăng ký qua Google</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, registration_enabled: s.registration_enabled === 'true' ? 'false' : 'true' }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.registration_enabled === 'true' ? 'bg-emerald-500' : 'bg-[hsl(var(--muted))]'}`}
            >
              <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.registration_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Session */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold">Session</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Session Timeout (hours)</label>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Thời gian hết hạn JWT token</p>
            <input
              type="number"
              value={settings.session_timeout_hours || '72'}
              onChange={e => setSettings(s => ({ ...s, session_timeout_hours: e.target.value }))}
              className="w-32 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
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
