'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Loader2, X, Check, RefreshCw, Zap, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminFetchProviders, adminCreateProvider, adminUpdateProvider, adminDeleteProvider, adminSyncProvider, adminTestProvider, adminQuickAdd9Router } from '@/lib/api';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProvider, setEditProvider] = useState<any>(null);
  const [form, setForm] = useState({ name: '', base_url: '', api_key: '' });
  const [saving, setSaving] = useState(false);
  const [quickAdding9Router, setQuickAdding9Router] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const load = () => {
    setLoading(true);
    adminFetchProviders().then(setProviders).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditProvider(null);
    setForm({ name: '', base_url: '', api_key: '' });
    setShowModal(true);
  };

  const openEdit = (provider: any) => {
    setEditProvider(provider);
    setForm({ name: provider.name, base_url: provider.base_url, api_key: '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editProvider) {
        const data: any = { name: form.name, base_url: form.base_url };
        if (form.api_key) data.api_key = form.api_key;
        await adminUpdateProvider(editProvider.id, data);
      } else {
        await adminCreateProvider(form);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAdd9Router = async () => {
    setQuickAdding9Router(true);
    try {
      const result = await adminQuickAdd9Router();
      alert(result.created
        ? 'Da them provider 9Router Local (http://localhost:20128/v1)'
        : '9Router Local da ton tai, se tai lai danh sach provider');
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setQuickAdding9Router(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa provider này sẽ xóa tất cả models liên quan. Tiếp tục?')) return;
    try {
      await adminDeleteProvider(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      const result = await adminSyncProvider(id);
      alert(`Da sync ${result.synced} models (tong: ${result.total})\nSource: ${result.source || 'unknown'}`);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncing(null);
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    setTestResult(null);
    try {
      const result = await adminTestProvider(id);
      setTestResult({ id, ...result });
    } catch (err: any) {
      setTestResult({ id, success: false, error: err.message });
    } finally {
      setTesting(null);
    }
  };

  const toggleActive = async (provider: any) => {
    try {
      await adminUpdateProvider(provider.id, { is_active: provider.is_active ? 0 : 1 });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{providers.length} providers</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickAdd9Router}
            disabled={quickAdding9Router}
            className="flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50"
          >
            {quickAdding9Router ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" />}
            Quick Add 9Router
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Add Provider
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {providers.map(provider => (
          <div key={provider.id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', provider.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500')}>
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{provider.name}</h4>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono truncate max-w-[200px]">{provider.base_url}</p>
                </div>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                provider.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-500/10 text-gray-500'
              )}>
                {provider.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="px-5 py-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[hsl(var(--muted-foreground))]">API Key:</span>
                <span className="font-mono">{provider.api_key}</span>
              </div>

              {testResult?.id === provider.id && (
                <div className={cn('rounded-lg px-3 py-2 text-xs', testResult.success ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400')}>
                  {testResult.success 
                    ? `✓ Connected (${testResult.latency}ms, ${testResult.modelCount} models)` 
                    : `✗ Failed: ${testResult.error || `Status ${testResult.status}`}`}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[hsl(var(--border))] flex items-center gap-2 flex-wrap">
              <button onClick={() => handleTest(provider.id)} disabled={testing === provider.id}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50">
                {testing === provider.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                Test
              </button>
              <button onClick={() => handleSync(provider.id)} disabled={syncing === provider.id}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50">
                {syncing === provider.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Sync Models
              </button>
              <button onClick={() => toggleActive(provider)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors">
                {provider.is_active ? 'Disable' : 'Enable'}
              </button>
              <div className="flex-1" />
              <button onClick={() => openEdit(provider)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => handleDelete(provider.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
          <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có AI Provider nào</p>
          <button onClick={openCreate} className="mt-3 text-sm text-[hsl(var(--primary))] hover:underline">Thêm provider đầu tiên</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editProvider ? 'Edit Provider' : 'Add Provider'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-[hsl(var(--muted))]"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. OpenAI, TrollLLM"
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Base URL</label>
                <input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))}
                  placeholder="https://api.openai.com/v1"
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">API Key (optional) {editProvider && '(leave empty to keep)'}</label>
                <input type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                  placeholder="De trong neu provider khong can key"
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] font-mono" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.base_url}
                className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {editProvider ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
