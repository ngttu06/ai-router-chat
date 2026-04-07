import Database from 'better-sqlite3';
import bcryptjs from 'bcryptjs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DB_PATH = path.join(process.cwd(), 'data', 'app.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============ CREATE TABLES ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT,
    password TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    is_active INTEGER DEFAULT 1,
    auth_provider TEXT DEFAULT 'local' CHECK(auth_provider IN ('local', 'google')),
    google_id TEXT UNIQUE,
    total_prompt_tokens INTEGER DEFAULT 0,
    total_completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    token_limit INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT DEFAULT 'New Chat',
    model_id TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    files TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (chat_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS models (
    id TEXT PRIMARY KEY,
    provider_id TEXT NOT NULL,
    name TEXT NOT NULL,
    vendor TEXT,
    max_context_tokens INTEGER DEFAULT 0,
    max_output_tokens INTEGER DEFAULT 0,
    max_prompt_tokens INTEGER DEFAULT 0,
    supports_streaming INTEGER DEFAULT 1,
    supports_vision INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
  CREATE INDEX IF NOT EXISTS idx_models_provider_id ON models(provider_id);
`);

// ============ SEED DEFAULT DATA ============
function seedDefaults() {
  // Create default admin user
  const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcryptjs.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (id, email, name, password, role, auth_provider, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), 'admin@trollllm.local', 'Administrator', hashedPassword, 'admin', 'local', 1);
    console.log('✅ Default admin user created (email: admin@trollllm.local, password: Ngttu2006@)');
  }

  // Create default AI provider
  const providerExists = db.prepare('SELECT id FROM ai_providers LIMIT 1').get();
  if (!providerExists) {
    const providerId = uuidv4();
    db.prepare(`
      INSERT INTO ai_providers (id, name, base_url, api_key, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).run(providerId, 'TrollLLM', 'https://chat.trollllm.xyz/v1', 'sk-trollllm-feefc2559d90ab79e7f6c8a07cd91ae305be61a0c0c4efb132b3558348422636', 1);
    console.log('✅ Default AI provider created (TrollLLM)');
  }

  // Seed default settings
  const defaultSettings = [
    { key: 'google_client_id', value: '', description: 'Google OAuth Client ID' },
    { key: 'google_client_secret', value: '', description: 'Google OAuth Client Secret (for redirect/code flow)' },
    { key: 'google_enabled', value: 'false', description: 'Enable Google OAuth login' },
    { key: 'allowed_email_domains', value: '', description: 'Comma-separated list of allowed email domains (empty = all)' },
    { key: 'default_model', value: '', description: 'Default model ID for new chats' },
    { key: 'max_file_size_mb', value: '20', description: 'Maximum file upload size in MB' },
    { key: 'session_timeout_hours', value: '72', description: 'JWT session timeout in hours' },
    { key: 'registration_enabled', value: 'true', description: 'Allow new users to register via Google' },
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)
  `);

  for (const s of defaultSettings) {
    insertSetting.run(s.key, s.value, s.description);
  }
}

seedDefaults();

// ============ HELPER FUNCTIONS ============

// --- Users ---
export function getUserById(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}

export function getUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function getUserByGoogleId(googleId: string) {
  return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId) as any;
}

export function createUser(data: {
  id?: string;
  email: string;
  name: string;
  avatar?: string;
  password?: string;
  role?: string;
  auth_provider?: string;
  google_id?: string;
}) {
  const id = data.id || uuidv4();
  const hashedPassword = data.password ? bcryptjs.hashSync(data.password, 10) : null;
  
  db.prepare(`
    INSERT INTO users (id, email, name, avatar, password, role, auth_provider, google_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.email, data.name, data.avatar || null,
    hashedPassword, data.role || 'user', data.auth_provider || 'local', data.google_id || null
  );
  
  return getUserById(id);
}

export function updateUser(id: string, data: Partial<{
  email: string;
  name: string;
  avatar: string;
  role: string;
  is_active: number;
  token_limit: number;
  password: string;
}>) {
  const fields: string[] = [];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === 'password') {
        fields.push('password = ?');
        values.push(bcryptjs.hashSync(value as string, 10));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  }
  
  if (fields.length === 0) return getUserById(id);
  
  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getUserById(id);
}

export function deleteUser(id: string) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

export function getAllUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[];
}

export function updateUserLogin(id: string) {
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(id);
}

export function updateUserTokenUsage(userId: string, promptTokens: number, completionTokens: number) {
  db.prepare(`
    UPDATE users SET 
      total_prompt_tokens = total_prompt_tokens + ?,
      total_completion_tokens = total_completion_tokens + ?,
      total_tokens = total_tokens + ?
    WHERE id = ?
  `).run(promptTokens, completionTokens, promptTokens + completionTokens, userId);
}

export function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  return bcryptjs.compareSync(plainPassword, hashedPassword);
}

// --- Chat Sessions ---
export function getChatsByUserId(userId: string) {
  return db.prepare('SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC').all(userId) as any[];
}

export function getChatById(id: string) {
  return db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(id) as any;
}

export function createChat(data: { id?: string; user_id: string; title?: string; model_id?: string }) {
  const id = data.id || uuidv4();
  db.prepare(`
    INSERT INTO chat_sessions (id, user_id, title, model_id)
    VALUES (?, ?, ?, ?)
  `).run(id, data.user_id, data.title || 'New Chat', data.model_id || null);
  return getChatById(id);
}

export function updateChat(id: string, data: Partial<{
  title: string;
  model_id: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}>) {
  const fields: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  values.push(id);
  db.prepare(`UPDATE chat_sessions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getChatById(id);
}

export function addChatTokenUsage(chatId: string, promptTokens: number, completionTokens: number) {
  db.prepare(`
    UPDATE chat_sessions SET 
      prompt_tokens = prompt_tokens + ?,
      completion_tokens = completion_tokens + ?,
      total_tokens = total_tokens + ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(promptTokens, completionTokens, promptTokens + completionTokens, chatId);
}

export function deleteChat(id: string) {
  db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(id);
}

// --- Messages ---
export function getMessagesByChatId(chatId: string) {
  return db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC').all(chatId) as any[];
}

export function createMessage(data: { id?: string; chat_id: string; role: string; content: string; files?: string }) {
  const id = data.id || uuidv4();
  db.prepare(`
    INSERT INTO messages (id, chat_id, role, content, files)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.chat_id, data.role, data.content, data.files || null);
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id) as any;
}

// --- AI Providers ---
export function getAllProviders() {
  return db.prepare('SELECT * FROM ai_providers ORDER BY created_at DESC').all() as any[];
}

export function getActiveProviders() {
  return db.prepare('SELECT * FROM ai_providers WHERE is_active = 1').all() as any[];
}

export function getProviderById(id: string) {
  return db.prepare('SELECT * FROM ai_providers WHERE id = ?').get(id) as any;
}

export function createProvider(data: { name: string; base_url: string; api_key?: string }) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO ai_providers (id, name, base_url, api_key)
    VALUES (?, ?, ?, ?)
  `).run(id, data.name, data.base_url, data.api_key || '');
  return getProviderById(id);
}

export function updateProvider(id: string, data: Partial<{
  name: string;
  base_url: string;
  api_key: string;
  is_active: number;
}>) {
  const fields: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  values.push(id);
  db.prepare(`UPDATE ai_providers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getProviderById(id);
}

export function deleteProvider(id: string) {
  db.prepare('DELETE FROM ai_providers WHERE id = ?').run(id);
}

// --- Models ---
export function getAllModels() {
  return db.prepare(`
    SELECT m.*, p.name as provider_name, p.base_url as provider_base_url
    FROM models m
    LEFT JOIN ai_providers p ON m.provider_id = p.id
    ORDER BY m.vendor, m.name
  `).all() as any[];
}

export function getActiveModels() {
  return db.prepare(`
    SELECT m.*, p.name as provider_name, p.base_url as provider_base_url, p.api_key as provider_api_key
    FROM models m
    LEFT JOIN ai_providers p ON m.provider_id = p.id
    WHERE m.is_active = 1 AND p.is_active = 1
    ORDER BY m.vendor, m.name
  `).all() as any[];
}

export function getModelById(id: string) {
  return db.prepare(`
    SELECT m.*, p.name as provider_name, p.base_url as provider_base_url, p.api_key as provider_api_key
    FROM models m
    LEFT JOIN ai_providers p ON m.provider_id = p.id
    WHERE m.id = ?
  `).get(id) as any;
}

export function upsertModel(data: {
  id: string;
  provider_id: string;
  name: string;
  vendor?: string;
  max_context_tokens?: number;
  max_output_tokens?: number;
  max_prompt_tokens?: number;
  supports_streaming?: number;
  supports_vision?: number;
  is_active?: number;
}) {
  db.prepare(`
    INSERT INTO models (id, provider_id, name, vendor, max_context_tokens, max_output_tokens, max_prompt_tokens, supports_streaming, supports_vision, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      provider_id = excluded.provider_id,
      name = excluded.name,
      vendor = COALESCE(excluded.vendor, vendor),
      max_context_tokens = COALESCE(excluded.max_context_tokens, max_context_tokens),
      max_output_tokens = COALESCE(excluded.max_output_tokens, max_output_tokens),
      max_prompt_tokens = COALESCE(excluded.max_prompt_tokens, max_prompt_tokens),
      supports_streaming = COALESCE(excluded.supports_streaming, supports_streaming),
      supports_vision = COALESCE(excluded.supports_vision, supports_vision)
  `).run(
    data.id, data.provider_id, data.name,
    data.vendor || null,
    data.max_context_tokens || 0,
    data.max_output_tokens || 0,
    data.max_prompt_tokens || 0,
    data.supports_streaming ?? 1,
    data.supports_vision ?? 0,
    data.is_active ?? 1
  );
}

export function updateModel(id: string, data: Partial<{ is_active: number; name: string }>) {
  const fields: string[] = [];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE models SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteModelsByProvider(providerId: string) {
  db.prepare('DELETE FROM models WHERE provider_id = ?').run(providerId);
}

// --- Settings ---
export function getSetting(key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string) {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, value);
}

export function getAllSettings() {
  return db.prepare('SELECT * FROM settings ORDER BY key').all() as any[];
}

export function getDefaultModelId(): string | null {
  const configuredModelId = getSetting('default_model');
  if (!configuredModelId) return null;

  const modelId = configuredModelId.trim();
  if (!modelId) return null;

  const row = db.prepare(`
    SELECT m.id
    FROM models m
    JOIN ai_providers p ON m.provider_id = p.id
    WHERE m.id = ? AND m.is_active = 1 AND p.is_active = 1
    LIMIT 1
  `).get(modelId) as { id: string } | undefined;

  return row?.id || null;
}

// --- Stats ---
export function getStats() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const chatCount = (db.prepare('SELECT COUNT(*) as count FROM chat_sessions').get() as any).count;
  const messageCount = (db.prepare('SELECT COUNT(*) as count FROM messages').get() as any).count;
  const totalTokens = (db.prepare('SELECT COALESCE(SUM(total_tokens), 0) as total FROM users').get() as any).total;
  const providerCount = (db.prepare('SELECT COUNT(*) as count FROM ai_providers WHERE is_active = 1').get() as any).count;
  const modelCount = (db.prepare('SELECT COUNT(*) as count FROM models WHERE is_active = 1').get() as any).count;
  
  const topUsers = db.prepare(`
    SELECT id, name, email, avatar, total_tokens, total_prompt_tokens, total_completion_tokens, last_login
    FROM users
    ORDER BY total_tokens DESC
    LIMIT 10
  `).all() as any[];

  const recentChats = db.prepare(`
    SELECT cs.*, u.name as user_name, u.email as user_email
    FROM chat_sessions cs
    JOIN users u ON cs.user_id = u.id
    ORDER BY cs.updated_at DESC
    LIMIT 10
  `).all() as any[];

  return {
    userCount,
    chatCount,
    messageCount,
    totalTokens,
    providerCount,
    modelCount,
    topUsers,
    recentChats,
  };
}

export default db;
