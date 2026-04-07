'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Bot, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { fetchGoogleAuthConfig, loginWithGoogle, loginWithPassword } from '@/lib/api';
import type { UserInfo } from '@/lib/api';

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
    }
  ) => void;
  prompt: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

interface LoginPageProps {
  onLogin: (user: UserInfo) => void;
  isDarkMode: boolean;
}

export default function LoginPage({ onLogin, isDarkMode }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleStatus, setGoogleStatus] = useState<'loading' | 'ready' | 'disabled' | 'error'>('loading');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonContainerRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await loginWithPassword(email.trim(), password);
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const setupGoogle = async () => {
      try {
        const config = await fetchGoogleAuthConfig();
        if (!mounted) return;

        if (!config.enabled || !config.clientId) {
          setGoogleStatus('disabled');
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (!mounted) return;

          const googleId = window.google?.accounts?.id;
          const container = googleButtonContainerRef.current;

          if (!googleId || !container) {
            setGoogleStatus('error');
            return;
          }

          googleId.initialize({
            client_id: config.clientId,
            callback: async (response: GoogleCredentialResponse) => {
              if (!response.credential) return;
              setGoogleLoading(true);
              setError('');
              try {
                const data = await loginWithGoogle(response.credential);
                onLogin(data.user);
              } catch (err: any) {
                setError(err.message || 'Đăng nhập Google thất bại');
              } finally {
                setGoogleLoading(false);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          container.innerHTML = '';
          googleId.renderButton(container, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'pill',
            logo_alignment: 'left',
            width: 280,
          });
          googleId.prompt();
          setGoogleStatus('ready');
        };

        script.onerror = () => {
          if (!mounted) return;
          setGoogleStatus('error');
        };

        document.head.appendChild(script);
      } catch {
        if (!mounted) return;
        setGoogleStatus('error');
      }
    };

    setupGoogle();

    return () => {
      mounted = false;
    };
  }, [onLogin]);

  return (
    <div className={`flex h-screen w-full items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] ${isDarkMode ? 'dark' : ''}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <div className="h-20 w-20 rounded-2xl bg-[hsl(var(--primary))] flex items-center justify-center mx-auto">
              <Bot className="h-10 w-10 text-[hsl(var(--primary-foreground))]" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">TrollLLM Chat</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Đăng nhập để tiếp tục</p>
        </div>

        {/* Login Form */}
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@trollllm.local"
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-shadow"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[hsl(var(--foreground))]">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] transition-shadow"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Google Login Section */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[hsl(var(--border))]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[hsl(var(--background))] px-3 text-[hsl(var(--muted-foreground))]">hoặc</span>
              </div>
            </div>

            <div id="google-signin-button" className="mt-4 flex justify-center">
              <div className="w-full">
                <div ref={googleButtonContainerRef} className="min-h-[44px] flex justify-center" />
                {googleStatus === 'loading' && (
                  <div className="text-xs text-[hsl(var(--muted-foreground))] text-center py-3">
                    Đang tải Google Sign-In...
                  </div>
                )}
                {googleStatus === 'disabled' && (
                  <div className="text-xs text-[hsl(var(--muted-foreground))] text-center py-3">
                    Đăng nhập Google chưa được bật trong Admin Settings
                  </div>
                )}
                {googleStatus === 'error' && (
                  <div className="text-xs text-red-500 text-center py-3">
                    Không thể tải Google Sign-In. Hãy restart backend và kiểm tra Client ID/origin trên Google Cloud.
                  </div>
                )}
                {googleLoading && (
                  <div className="mt-2 text-xs text-[hsl(var(--muted-foreground))] text-center flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang xác thực Google...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          TrollLLM Chat • AI Chat Platform
        </p>
      </motion.div>
    </div>
  );
}
