# AI Router Chat

A full-stack AI chat application built with **Next.js** — frontend and backend API running on the same port.

## ✨ Features

- 💬 **Multi-model Chat** — Connect to any OpenAI-compatible API provider (OpenAI, Anthropic, Google, local models, etc.)
- 🔄 **Streaming Responses** — Real-time token streaming with SSE
- 📎 **File Upload & Context** — Upload files and use them as context in conversations
- 👤 **User Authentication** — Email/password + Google OAuth login
- 👥 **Guest Mode** — Use without login (no chat history saved)
- 🛡️ **Admin Panel** — Manage users, providers, models, settings
- 🔌 **Multi-Provider** — Add multiple AI providers and sync their models
- 📊 **Token Usage Tracking** — Per-chat and per-user token usage stats
- 🌙 **Dark/Light Mode** — Toggle between themes
- 💾 **SQLite Database** — Zero-config persistent storage

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19, Tailwind CSS 4, Motion, Lucide Icons |
| Backend | Next.js API Routes (server-side) |
| Database | SQLite (better-sqlite3) |
| Auth | JWT + Google OAuth |
| Language | TypeScript |

## 📁 Project Structure

```
ai-router-chat/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Chat page (/)
│   ├── login/page.tsx      # Login page
│   ├── admin/page.tsx      # Admin panel
│   └── api/                # API Routes
│       ├── auth/           # Authentication endpoints
│       ├── chat/           # Chat completion (streaming)
│       ├── chats/          # Chat sessions CRUD
│       ├── models/         # Available models
│       ├── upload/         # File upload
│       └── admin/          # Admin API (users, providers, models, settings)
├── components/             # React components ('use client')
│   ├── ChatApp.tsx         # Main chat application
│   ├── LoginPage.tsx       # Login page component
│   └── admin/              # Admin panel components
├── lib/                    # Client-side utilities
│   ├── api.ts              # API client functions
│   └── utils.ts            # Utility helpers
├── server/                 # Server-side modules
│   ├── auth-helpers.ts     # JWT & auth middleware
│   ├── database.ts         # SQLite database layer
│   └── file-store.ts       # In-memory file store
└── data/                   # SQLite database (auto-created)
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/ngttu06/ai-router-chat.git
cd ai-router-chat

# Install dependencies
npm install

# Copy environment variables (optional)
cp .env.example .env
```

### Configuration

Edit `.env` file (optional):

```env
JWT_SECRET=your-secret-key-here
PORT=3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 🔧 Default Admin Account

On first run, a default admin account is created:

| Field | Value |
|-------|-------|
| Email | `admin@trollllm.com` |
| Password | `admin123` |

⚠️ **Change the password immediately after first login!**

## 📖 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google/config` | Google auth config |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message (streaming) |
| GET | `/api/models` | List available models |
| POST | `/api/upload` | Upload files |

### Chat Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | List user's chats |
| POST | `/api/chats` | Create new chat |
| PUT | `/api/chats/:id` | Update chat |
| DELETE | `/api/chats/:id` | Delete chat |
| GET | `/api/chats/:id/messages` | Get chat messages |
| POST | `/api/chats/:id/messages` | Save message |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET/POST | `/api/admin/users` | List/Create users |
| PUT/DELETE | `/api/admin/users/:id` | Update/Delete user |
| GET/POST | `/api/admin/providers` | List/Create providers |
| PUT/DELETE | `/api/admin/providers/:id` | Update/Delete provider |
| POST | `/api/admin/providers/:id/sync` | Sync provider models |
| POST | `/api/admin/providers/:id/test` | Test provider connection |
| GET | `/api/admin/models` | List all models |
| PUT | `/api/admin/models/:id` | Update model |
| GET/PUT | `/api/admin/settings` | Get/Update settings |

## 📄 License

MIT
