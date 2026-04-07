'use client';
import { useState, useEffect } from 'react';
import { Loader2, Coins } from 'lucide-react';
import { adminFetchUsers } from '@/lib/api';

export default function TokensPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetchUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" /></div>;
  }

  const totalPrompt = users.reduce((s, u) => s + (u.total_prompt_tokens || 0), 0);
  const totalCompletion = users.reduce((s, u) => s + (u.total_completion_tokens || 0), 0);
  const totalAll = users.reduce((s, u) => s + (u.total_tokens || 0), 0);

  const sortedUsers = [...users].sort((a, b) => (b.total_tokens || 0) - (a.total_tokens || 0));
  const maxTokens = sortedUsers[0]?.total_tokens || 1;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalPrompt.toLocaleString()}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Prompt Tokens</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalCompletion.toLocaleString()}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Completion Tokens</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{totalAll.toLocaleString()}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">Total Tokens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-user breakdown with visual bars */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold">Per-User Token Usage</h3>
        </div>
        <div className="p-5 space-y-4">
          {sortedUsers.map(user => {
            const pct = maxTokens > 0 ? ((user.total_tokens || 0) / maxTokens) * 100 : 0;
            return (
              <div key={user.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-6 w-6 rounded-full" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] text-[10px] font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">({user.email})</span>
                  </div>
                  <div className="text-sm tabular-nums font-medium">{(user.total_tokens || 0).toLocaleString()}</div>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                  <span>Prompt: {(user.total_prompt_tokens || 0).toLocaleString()}</span>
                  <span>Completion: {(user.total_completion_tokens || 0).toLocaleString()}</span>
                  {user.token_limit > 0 && <span>Limit: {user.token_limit.toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
          {sortedUsers.length === 0 && (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">Chưa có dữ liệu token</div>
          )}
        </div>
      </div>
    </div>
  );
}
