// ============ TOKEN MANAGEMENT ============
const TOKEN_KEY = 'trollllm-auth-token';
const USER_KEY = 'trollllm-auth-user';

export type UserInfo = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: 'user' | 'admin';
};

export type GoogleAuthConfig = {
  enabled: boolean;
  clientId: string;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): UserInfo | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserInfo) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ============ API HELPERS ============
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return res;
}

// ============ AUTH API ============
export async function loginWithPassword(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Login failed');
  }
  const data = await res.json();
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function loginWithGoogle(credential: string) {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Google login failed');
  }
  const data = await res.json();
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function fetchGoogleAuthConfig(): Promise<GoogleAuthConfig> {
  const res = await fetch('/api/auth/google/config');
  if (!res.ok) throw new Error('Failed to fetch Google auth config');
  return res.json();
}

export async function getMe() {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) throw new Error('Not authenticated');
  const data = await res.json();
  setStoredUser(data.user);
  return data.user as UserInfo;
}

export function logout() {
  removeToken();
  window.location.href = '/';
}

// ============ CHAT API ============
export async function fetchModels() {
  const res = await fetch('/api/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function fetchChats() {
  const res = await apiFetch('/api/chats');
  if (!res.ok) throw new Error('Failed to fetch chats');
  return res.json();
}

export async function createChatSession(title?: string, modelId?: string) {
  const res = await apiFetch('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ title, model_id: modelId }),
  });
  if (!res.ok) throw new Error('Failed to create chat');
  return res.json();
}

export async function updateChatSession(id: string, data: Record<string, any>) {
  const res = await apiFetch(`/api/chats/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update chat');
  return res.json();
}

export async function deleteChatSession(id: string) {
  const res = await apiFetch(`/api/chats/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete chat');
  return res.json();
}

export async function fetchMessages(chatId: string) {
  const res = await apiFetch(`/api/chats/${chatId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function saveMessage(chatId: string, role: string, content: string, files?: any[]) {
  const res = await apiFetch(`/api/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ role, content, files }),
  });
  if (!res.ok) throw new Error('Failed to save message');
  return res.json();
}

export async function sendChatMessage(
  model: string,
  messages: { role: string; content: string }[],
  chatId: string | null,
  fileContext?: any[],
  signal?: AbortSignal
) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch('/api/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, chatId, fileContext }),
    signal,
  });
}

export async function uploadFiles(formData: FormData) {
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

// ============ ADMIN API ============
export async function adminFetchStats() {
  const res = await apiFetch('/api/admin/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function adminFetchUsers() {
  const res = await apiFetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function adminCreateUser(data: Record<string, any>) {
  const res = await apiFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create user'); }
  return res.json();
}

export async function adminUpdateUser(id: string, data: Record<string, any>) {
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update user');
  return res.json();
}

export async function adminDeleteUser(id: string) {
  const res = await apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete user'); }
  return res.json();
}

export async function adminFetchProviders() {
  const res = await apiFetch('/api/admin/providers');
  if (!res.ok) throw new Error('Failed to fetch providers');
  return res.json();
}

export async function adminCreateProvider(data: Record<string, any>) {
  const res = await apiFetch('/api/admin/providers', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create provider'); }
  return res.json();
}

export async function adminUpdateProvider(id: string, data: Record<string, any>) {
  const res = await apiFetch(`/api/admin/providers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update provider'); }
  return res.json();
}

export async function adminDeleteProvider(id: string) {
  const res = await apiFetch(`/api/admin/providers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete provider');
  return res.json();
}

export async function adminSyncProvider(id: string) {
  const res = await apiFetch(`/api/admin/providers/${id}/sync`, { method: 'POST' });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to sync provider'); }
  return res.json();
}

export async function adminTestProvider(id: string) {
  const res = await apiFetch(`/api/admin/providers/${id}/test`, { method: 'POST' });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to test provider'); }
  return res.json();
}

export async function adminQuickAdd9Router() {
  const res = await apiFetch('/api/admin/providers/quick-add/9router', { method: 'POST' });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to quick add 9router'); }
  return res.json();
}

export async function adminFetchModels() {
  const res = await apiFetch('/api/admin/models');
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
}

export async function adminUpdateModel(id: string, data: Record<string, any>) {
  const encodedId = encodeURIComponent(id);
  const res = await apiFetch(`/api/admin/models/${encodedId}`, { method: 'PUT', body: JSON.stringify(data) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update model'); }
  return res.json();
}

export async function adminFetchSettings() {
  const res = await apiFetch('/api/admin/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function adminUpdateSettings(settings: Record<string, string>) {
  const res = await apiFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}
