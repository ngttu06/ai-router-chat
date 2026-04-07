'use client';

import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';
import type { UserInfo } from '@/lib/api';
import { useState, useEffect } from 'react';

const DARK_MODE_KEY = 'trollllm-dark-mode';

export default function LoginRoute() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsDarkMode(localStorage.getItem(DARK_MODE_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  return (
    <LoginPage
      onLogin={(user: UserInfo) => {
        router.push('/');
      }}
      isDarkMode={isDarkMode}
    />
  );
}
