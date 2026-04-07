'use client';
import { useState, useEffect } from 'react';
import { Loader2, Brain, Eye, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminFetchModels, adminUpdateModel } from '@/lib/api';

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = () => {
    setLoading(true);
    adminFetchModels().then(setModels).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (model: any) => {
    try {
      await adminUpdateModel(model.id, { is_active: model.is_active ? 0 : 1 });
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" /></div>;
  }

  const vendors = Array.from(new Set(models.map(m => m.vendor || 'Unknown')));
  const filtered = filter ? models.filter(m => (m.vendor || 'Unknown') === filter) : models;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{models.length} models</p>
          {models.length === 0 && (
            <span className="text-xs text-amber-500">→ Sync models từ Providers page</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-1.5 text-xs focus:outline-none">
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <th className="text-left px-5 py-3 font-medium">Model</th>
                <th className="text-left px-5 py-3 font-medium">Vendor</th>
                <th className="text-left px-5 py-3 font-medium">Provider</th>
                <th className="text-right px-5 py-3 font-medium">Context</th>
                <th className="text-center px-5 py-3 font-medium">Features</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(model => (
                <tr key={model.id} className="border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--muted))]/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <div>
                        <div className="font-medium text-xs">{model.name}</div>
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{model.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium',
                      model.vendor?.toLowerCase() === 'anthropic' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' :
                      model.vendor?.toLowerCase() === 'google' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                      model.vendor?.toLowerCase() === 'openai' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                      'bg-gray-500/10 text-gray-500'
                    )}>
                      {model.vendor || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[hsl(var(--muted-foreground))]">{model.provider_name || '-'}</td>
                  <td className="text-right px-5 py-3 tabular-nums text-xs">
                    {model.max_context_tokens ? `${(model.max_context_tokens / 1000).toFixed(0)}k` : '-'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {model.supports_streaming ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500"><Radio className="h-3 w-3" /> Stream</span>
                      ) : null}
                      {model.supports_vision ? (
                        <span className="flex items-center gap-1 text-[10px] text-blue-500"><Eye className="h-3 w-3" /> Vision</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="text-center px-5 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium',
                      model.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-500/10 text-gray-500'
                    )}>
                      {model.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="text-right px-5 py-3">
                    <button onClick={() => toggleActive(model)}
                      className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                        model.is_active ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-emerald-500/10 hover:text-emerald-500'
                      )}>
                      {model.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                  {models.length === 0 ? 'Chưa có models. Hãy sync từ AI Providers.' : 'Không tìm thấy model nào.'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
