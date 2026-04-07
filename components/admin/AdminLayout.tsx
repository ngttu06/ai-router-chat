'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  Coins,
  Shield,
  Server,
  Brain,
  Settings,
  LogOut,
  MessageSquare,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/lib/api';
import type { UserInfo } from '@/lib/api';

import Dashboard from './Dashboard';
import UsersPage from './UsersPage';
import TokensPage from './TokensPage';
import AuthSettings from './AuthSettings';
import ProvidersPage from './ProvidersPage';
import ModelsPage from './ModelsPage';
import SettingsPage from './SettingsPage';

type AdminPage = 'dashboard' | 'users' | 'tokens' | 'auth' | 'providers' | 'models' | 'settings';

const navItems: { id: AdminPage; label: string; icon: any }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tokens', label: 'Token Usage', icon: Coins },
  { id: 'auth', label: 'Authentication', icon: Shield },
  { id: 'providers', label: 'AI Providers', icon: Server },
  { id: 'models', label: 'Models', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface AdminLayoutProps {
  user: UserInfo;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
}

export default function AdminLayout({ user, isDarkMode, setIsDarkMode }: AdminLayoutProps) {
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const goToChat = () => {
    window.location.href = '/';
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UsersPage />;
      case 'tokens': return <TokensPage />;
      case 'auth': return <AuthSettings />;
      case 'providers': return <ProvidersPage />;
      case 'models': return <ModelsPage />;
      case 'settings': return <SettingsPage />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-full flex-shrink-0 border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))] flex flex-col z-20 relative"
          >
            {/* Header */}
            <div className="p-4 border-b border-[hsl(var(--sidebar-border))]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[hsl(var(--primary-foreground))]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Admin Panel</h2>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">TrollLLM Chat</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActivePage(item.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        activePage === item.id
                          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium'
                          : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                      {activePage === item.id && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-[hsl(var(--sidebar-border))]">
                <button
                  onClick={goToChat}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Quay lại Chat
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[hsl(var(--sidebar-border))] space-y-1">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-[hsl(var(--muted))]"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-7 w-7 rounded-full" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{user.name}</div>
                  <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{user.email}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-4 bg-[hsl(var(--background))]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold">
              {navItems.find(n => n.id === activePage)?.label || 'Admin'}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
