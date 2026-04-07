'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getToken, getMe, getStoredUser } from '@/lib/api';
import type { UserInfo } from '@/lib/api';
import AdminLayout from '@/components/admin/AdminLayout';

const DARK_MODE_KEY = 'trollllm-dark-mode';

export default function AdminPage() {
  const [user, setUser] = useState<UserInfo | null>(getStoredUser());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsDarkMode(localStorage.getItem(DARK_MODE_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    getMe()
      .then((u) => {
        if (u.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(u);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <AdminLayout user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
}
