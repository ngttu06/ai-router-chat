'use client';
import { useState, useEffect } from 'react';
import { Users, MessageSquare, Coins, Server, Brain, Loader2 } from 'lucide-react';
import { adminFetchStats } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetchStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  if (!stats) return <div className="text-center text-[hsl(var(--muted-foreground))]">Không thể tải dữ liệu</div>;

  const cards = [
    { label: 'Total Users', value: stats.userCount, icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Chat Sessions', value: stats.chatCount, icon: MessageSquare, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Total Messages', value: stats.messageCount, icon: MessageSquare, color: 'text-purple-500 bg-purple-500/10' },
    { label: 'Total Tokens', value: stats.totalTokens?.toLocaleString(), icon: Coins, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Active Providers', value: stats.providerCount, icon: Server, color: 'text-cyan-500 bg-cyan-500/10' },
    { label: 'Active Models', value: stats.modelCount, icon: Brain, color: 'text-pink-500 bg-pink-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{card.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Users */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold">Top Users by Token Usage</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-right px-5 py-3 font-medium">Prompt Tokens</th>
                <th className="text-right px-5 py-3 font-medium">Completion Tokens</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers?.map((user: any) => (
                <tr key={user.id} className="border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--muted))]/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="h-7 w-7 rounded-full" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] text-xs font-bold">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right px-5 py-3 tabular-nums">{user.total_prompt_tokens?.toLocaleString()}</td>
                  <td className="text-right px-5 py-3 tabular-nums">{user.total_completion_tokens?.toLocaleString()}</td>
                  <td className="text-right px-5 py-3 tabular-nums font-medium">{user.total_tokens?.toLocaleString()}</td>
                </tr>
              ))}
              {(!stats.topUsers || stats.topUsers.length === 0) && (
                <tr><td colSpan={4} className="text-center py-8 text-[hsl(var(--muted-foreground))]">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Chats */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold">Recent Chat Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <th className="text-left px-5 py-3 font-medium">Title</th>
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Model</th>
                <th className="text-right px-5 py-3 font-medium">Tokens</th>
                <th className="text-right px-5 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentChats?.map((chat: any) => (
                <tr key={chat.id} className="border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--muted))]/50">
                  <td className="px-5 py-3 font-medium truncate max-w-[200px]">{chat.title}</td>
                  <td className="px-5 py-3 text-[hsl(var(--muted-foreground))]">{chat.user_name}</td>
                  <td className="px-5 py-3 text-xs">{chat.model_id || '-'}</td>
                  <td className="text-right px-5 py-3 tabular-nums">{chat.total_tokens?.toLocaleString()}</td>
                  <td className="text-right px-5 py-3 text-xs text-[hsl(var(--muted-foreground))]">{chat.updated_at}</td>
                </tr>
              ))}
              {(!stats.recentChats || stats.recentChats.length === 0) && (
                <tr><td colSpan={5} className="text-center py-8 text-[hsl(var(--muted-foreground))]">Chưa có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
