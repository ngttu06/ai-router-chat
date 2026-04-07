'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Loader2, X, Check, Ban, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { adminFetchUsers, adminCreateUser, adminUpdateUser, adminDeleteUser } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'user', token_limit: 0 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminFetchUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ email: '', name: '', password: '', role: 'user', token_limit: 0 });
    setShowModal(true);
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({ email: user.email, name: user.name, password: '', role: user.role, token_limit: user.token_limit || 0 });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        const data: any = { name: form.name, role: form.role, token_limit: form.token_limit };
        if (form.password) data.password = form.password;
        await adminUpdateUser(editUser.id, data);
      } else {
        await adminCreateUser(form);
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa user này?')) return;
    try {
      await adminDeleteUser(id);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (user: any) => {
    try {
      await adminUpdateUser(user.id, { is_active: user.is_active ? 0 : 1 });
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
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{users.length} users</p>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                <th className="text-left px-5 py-3 font-medium">User</th>
                <th className="text-left px-5 py-3 font-medium">Role</th>
                <th className="text-left px-5 py-3 font-medium">Provider</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Total Tokens</th>
                <th className="text-right px-5 py-3 font-medium">Token Limit</th>
                <th className="text-left px-5 py-3 font-medium">Last Login</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[hsl(var(--border))]/50 hover:bg-[hsl(var(--muted))]/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] text-xs font-bold">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                      user.role === 'admin' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-[hsl(var(--muted-foreground))]">{user.auth_provider}</td>
                  <td className="px-5 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                      user.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-500/10 text-gray-500'
                    )}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-right px-5 py-3 tabular-nums">{user.total_tokens?.toLocaleString()}</td>
                  <td className="text-right px-5 py-3 tabular-nums text-[hsl(var(--muted-foreground))]">
                    {user.token_limit ? user.token_limit.toLocaleString() : '∞'}
                  </td>
                  <td className="px-5 py-3 text-xs text-[hsl(var(--muted-foreground))]">{user.last_login || 'Never'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleActive(user)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors" title={user.is_active ? 'Deactivate' : 'Activate'}>
                        {user.is_active ? <Ban className="h-3.5 w-3.5 text-amber-500" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
                      </button>
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-[hsl(var(--muted))]"><X className="h-4 w-4" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Email</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editUser}
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] disabled:opacity-50" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Password {editUser && '(leave empty to keep)'}</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Token Limit (0 = unlimited)</label>
                <input type="number" value={form.token_limit} onChange={e => setForm(f => ({ ...f, token_limit: parseInt(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.email || !form.name}
                className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {editUser ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
