'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  MessageSquare, 
  Moon, 
  Sun,
  ChevronDown,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  Trash2,
  Gauge,
  Loader2,
  Paperclip,
  X,
  FileText,
  FileCode,
  FileSpreadsheet,
  File as FileIcon,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getToken, getStoredUser, getMe, logout,
  fetchModels, fetchChats, createChatSession, updateChatSession, deleteChatSession,
  fetchMessages, saveMessage, sendChatMessage, uploadFiles,
} from '@/lib/api';
import type { UserInfo } from '@/lib/api';
import LoginPage from '@/components/LoginPage';
import AdminLayout from '@/components/admin/AdminLayout';

// ============ TYPES ============
type ModelInfo = {
  id: string;
  name: string;
  vendor: string;
  maxContextTokens: number;
  maxOutputTokens: number;
  maxPromptTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
};

type UploadedFile = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: UploadedFile[];
};

type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  tokenUsage: TokenUsage;
  files: UploadedFile[];
  updatedAt: number;
};

type InitStep = {
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  detail?: string;
};

// ============ STORAGE HELPERS ============
const DARK_MODE_KEY = 'trollllm-dark-mode';

function loadDarkMode(): boolean {
  try {
    return localStorage.getItem(DARK_MODE_KEY) === 'true';
  } catch { return false; }
}

// ============ HELPERS ============
function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes('text') || mimeType.includes('plain')) return FileText;
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('python') || mimeType.includes('java') || mimeType.includes('xml') || mimeType.includes('html') || mimeType.includes('css')) return FileCode;
  if (mimeType.includes('csv') || mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return FileIcon;
}

function getFileExtension(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized === 'image/jpeg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/gif') return 'gif';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/bmp') return 'bmp';
  if (normalized === 'application/pdf') return 'pdf';
  if (normalized === 'text/plain') return 'txt';

  const slashIndex = normalized.indexOf('/');
  if (slashIndex >= 0 && slashIndex < normalized.length - 1) {
    return normalized.slice(slashIndex + 1).split('+')[0] || 'bin';
  }
  return 'bin';
}

function getUploadFileName(file: File, index: number, batchId: number): string {
  if (file.name.trim()) return file.name;
  const prefix = file.type.startsWith('image/') ? 'clipboard-image' : 'clipboard-file';
  return `${prefix}-${batchId}-${index + 1}.${getFileExtension(file.type || 'application/octet-stream')}`;
}

// ============ PATHNAME ROUTING ============
function usePathRoute() {
  const [pathname, setPathname] = useState(window.location.pathname);
  
  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  
  return pathname;
}

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// ============ COMPONENTS ============
const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between bg-zinc-800/80 px-4 py-2 text-xs text-zinc-300 font-sans">
        <span className="uppercase font-semibold tracking-wider">{language}</span>
        <button onClick={copyToClipboard} className="flex items-center gap-1.5 hover:text-white transition-colors">
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {isCopied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-sm text-zinc-50 bg-zinc-900">
        <pre className="m-0 p-0 bg-transparent"><code className={`language-${language}`}>{value}</code></pre>
      </div>
    </div>
  );
};

const ContextUsageBar = ({ usage, maxContext }: { usage: TokenUsage; maxContext: number }) => {
  const used = usage.totalTokens;
  const percentage = maxContext > 0 ? Math.min((used / maxContext) * 100, 100) : 0;
  
  let barColor = 'bg-emerald-500';
  if (percentage > 80) barColor = 'bg-red-500';
  else if (percentage > 60) barColor = 'bg-amber-500';
  else if (percentage > 40) barColor = 'bg-yellow-500';

  const formatNumber = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-xs text-[hsl(var(--muted-foreground))]">
      <Gauge className="h-3.5 w-3.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium">Context</span>
          <span>{formatNumber(used)} / {formatNumber(maxContext)} tokens</span>
        </div>
        <div className="context-bar bg-[hsl(var(--muted))]">
          <div className={`context-bar-fill ${barColor}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
      <span className="font-mono text-[10px] tabular-nums flex-shrink-0">{percentage.toFixed(1)}%</span>
    </div>
  );
};

const FileChip = ({ file, onRemove }: { file: UploadedFile; onRemove?: () => void }) => {
  const Icon = getFileIcon(file.mimeType);
  return (
    <div className="group flex items-center gap-2 rounded-lg bg-[hsl(var(--muted))] px-3 py-1.5 text-xs border border-[hsl(var(--border))]">
      <Icon className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
      <span className="font-medium truncate max-w-[120px]">{file.name}</span>
      <span className="text-[hsl(var(--muted-foreground))]">{formatFileSize(file.size)}</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-1 text-[hsl(var(--muted-foreground))] hover:text-red-500 transition-colors">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

// ============ INITIALIZATION SCREEN ============
const InitScreen = ({ steps, onRetry }: { steps: InitStep[]; onRetry: () => void }) => {
  const allDone = steps.every(s => s.status === 'done');
  const hasError = steps.some(s => s.status === 'error');

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <motion.div 
            animate={{ rotate: allDone ? 0 : 360 }} 
            transition={{ repeat: allDone ? 0 : Infinity, duration: 3, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Bot className="h-16 w-16 text-[hsl(var(--primary))]" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">TrollLLM Chat</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Đang chuẩn bị các thành phần...</p>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-lg space-y-4">
          {steps.map((step, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]/30" />}
                {step.status === 'loading' && <Loader2 className="h-5 w-5 text-[hsl(var(--primary))] animate-spin" />}
                {step.status === 'done' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="h-5 w-5 text-emerald-500" /></motion.div>}
                {step.status === 'error' && <X className="h-5 w-5 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn("text-sm font-medium", step.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : step.status === 'error' ? 'text-red-500' : '')}>
                  {step.label}
                </div>
                {step.detail && <div className="text-xs text-[hsl(var(--muted-foreground))] truncate">{step.detail}</div>}
              </div>
            </motion.div>
          ))}
        </div>

        {hasError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
            <button onClick={onRetry} className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-medium hover:opacity-90 transition-opacity">
              Thử lại
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// ============ CHAT APP ============
function ChatApp({ user, isDarkMode, setIsDarkMode }: { user: UserInfo | null; isDarkMode: boolean; setIsDarkMode: (v: boolean) => void }) {
  const isGuest = !user;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const [initSteps, setInitSteps] = useState<InitStep[]>([
    { label: 'Kết nối tới Backend Server', status: 'pending' },
    { label: 'Tải danh sách Models', status: 'pending' },
    { label: 'Khởi tạo giao diện Chat', status: 'pending' },
    { label: 'Tải dữ liệu đã lưu', status: 'pending' },
  ]);
  
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [systemDefaultModelId, setSystemDefaultModelId] = useState<string>('');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateStep = (index: number, update: Partial<InitStep>) => {
    setInitSteps(prev => prev.map((s, i) => i === index ? { ...s, ...update } : s));
  };

  // ===== Initialization sequence =====
  const runInit = useCallback(async () => {
    const steps = isGuest
      ? [
          { label: 'Kết nối tới Backend Server', status: 'loading' as const },
          { label: 'Tải danh sách Models', status: 'pending' as const },
          { label: 'Khởi tạo giao diện Chat', status: 'pending' as const },
        ]
      : [
          { label: 'Kết nối tới Backend Server', status: 'loading' as const },
          { label: 'Tải danh sách Models', status: 'pending' as const },
          { label: 'Khởi tạo giao diện Chat', status: 'pending' as const },
          { label: 'Tải dữ liệu đã lưu', status: 'pending' as const },
        ];
    setInitSteps(steps);

    try {
      // Step 1: Fetch models from API
      const data = await fetchModels();
      updateStep(0, { status: 'done', detail: 'Đã kết nối thành công' });

      // Step 2: Parse models
      await new Promise(r => setTimeout(r, 300));
      updateStep(1, { status: 'loading' });

      const parsed: ModelInfo[] = (data.data || []).map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        vendor: m.vendor || 'Unknown',
        maxContextTokens: m.maxContextTokens || 0,
        maxOutputTokens: m.maxOutputTokens || 0,
        maxPromptTokens: m.maxPromptTokens || 0,
        supportsStreaming: m.supportsStreaming ?? true,
        supportsVision: m.supportsVision ?? false,
      }));

      setModels(parsed);

      const configuredDefaultModelId = typeof data.defaultModelId === 'string'
        ? data.defaultModelId.trim()
        : '';
      const isConfiguredDefaultAvailable = configuredDefaultModelId
        ? parsed.some(model => model.id === configuredDefaultModelId)
        : false;
      const resolvedDefaultModelId = isConfiguredDefaultAvailable
        ? configuredDefaultModelId
        : (parsed[0]?.id || '');

      setSystemDefaultModelId(resolvedDefaultModelId);
      setSelectedModelId(resolvedDefaultModelId);

      setIsLoadingModels(false);
      updateStep(1, { status: 'done', detail: `${parsed.length} models từ ${new Set(parsed.map(m => m.vendor)).size} nhà cung cấp` });

      // Step 3: Init UI
      await new Promise(r => setTimeout(r, 300));
      updateStep(2, { status: 'loading' });
      await new Promise(r => setTimeout(r, 200));
      updateStep(2, { status: 'done', detail: 'Giao diện sẵn sàng' });

      // Step 4: Load saved chats from server (only for logged-in users)
      if (!isGuest) {
        await new Promise(r => setTimeout(r, 200));
        updateStep(3, { status: 'loading' });
        
        const serverChats = await fetchChats();
        const loadedChats: ChatSession[] = [];
        
        for (const sc of serverChats) {
          const msgs = await fetchMessages(sc.id);
          loadedChats.push({
            id: sc.id,
            title: sc.title,
            messages: msgs.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              files: m.files ? JSON.parse(m.files) : undefined,
            })),
            modelId: sc.model_id || resolvedDefaultModelId,
            tokenUsage: {
              promptTokens: sc.prompt_tokens || 0,
              completionTokens: sc.completion_tokens || 0,
              totalTokens: sc.total_tokens || 0,
            },
            files: [],
            updatedAt: new Date(sc.updated_at).getTime(),
          });
        }
        
        setChats(loadedChats);
        if (loadedChats.length > 0) setActiveChatId(loadedChats[0].id);
        
        await new Promise(r => setTimeout(r, 200));
        updateStep(3, { status: 'done', detail: loadedChats.length > 0 ? `${loadedChats.length} cuộc trò chuyện` : 'Không có dữ liệu cũ' });
      }

      await new Promise(r => setTimeout(r, 500));
      setIsAppReady(true);

    } catch (error: any) {
      console.error('Init failed:', error);
      setInitSteps(prev => {
        const loadingIdx = prev.findIndex(s => s.status === 'loading');
        if (loadingIdx >= 0) {
          return prev.map((s, i) => i === loadingIdx ? { ...s, status: 'error' as const, detail: error.message || 'Không thể kết nối' } : s);
        }
        return prev.map((s, i) => i === 0 ? { ...s, status: 'error' as const, detail: 'Backend chưa sẵn sàng - hãy chạy: npm run server' } : s);
      });
    }
  }, [isGuest]);

  useEffect(() => { runInit(); }, []);

  const selectedModel = models.find(m => m.id === selectedModelId);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatId, isLoading, streamingContent]);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (chats.length === 0 && !isLoadingModels && isAppReady) createNewChat();
    else if (chats.length > 0 && !activeChatId) setActiveChatId(chats[0].id);
  }, [isLoadingModels, isAppReady]);

  const createNewChat = useCallback(async () => {
    const newChatModelId = systemDefaultModelId || selectedModelId || (models[0]?.id || '');

    if (isGuest) {
      // Guest: create local-only chat, no server call
      const newChat: ChatSession = {
        id: `guest-${Date.now()}`,
        title: 'New Chat',
        messages: [],
        modelId: newChatModelId,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        files: [],
        updatedAt: Date.now(),
      };
      setChats([newChat]); // Guest only has 1 chat
      setActiveChatId(newChat.id);
      setSelectedModelId(newChatModelId);
      setPendingFiles([]);
      return;
    }
    try {
      const serverChat = await createChatSession('New Chat', newChatModelId || undefined);
      const newChat: ChatSession = {
        id: serverChat.id,
        title: 'New Chat',
        messages: [],
        modelId: newChatModelId,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        files: [],
        updatedAt: Date.now(),
      };
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setSelectedModelId(newChatModelId);
      setPendingFiles([]);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  }, [isGuest, models, selectedModelId, systemDefaultModelId]);

  const handleDeleteChat = async (chatId: string) => {
    if (isGuest) {
      setChats([]);
      setActiveChatId(null);
      return;
    }
    try {
      await deleteChatSession(chatId);
      setChats(prev => {
        const updated = prev.filter(c => c.id !== chatId);
        if (activeChatId === chatId) setActiveChatId(updated.length > 0 ? updated[0].id : null);
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  // ===== File Upload =====
  const uploadSelectedFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    const batchId = Date.now();

    files.forEach((file, index) => {
      // Clipboard image blobs can be nameless, so assign a safe fallback name.
      formData.append('files', file, getUploadFileName(file, index, batchId));
    });

    try {
      const data = await uploadFiles(formData);
      if (data.files) {
        const newFiles: UploadedFile[] = data.files;
        setPendingFiles(prev => [...prev, ...newFiles]);
        if (activeChatId) {
          setChats(prev => prev.map(chat =>
            chat.id === activeChatId
              ? { ...chat, files: [...chat.files, ...newFiles] }
              : chat
          ));
        }
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    try {
      await uploadSelectedFiles(files);
    } finally {
      e.target.value = '';
    }
  };

  const handleInputPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedFiles = e.clipboardData.files.length > 0
      ? Array.from(e.clipboardData.files)
      : Array.from(e.clipboardData.items)
          .filter(item => item.kind === 'file')
          .map(item => item.getAsFile())
          .filter((file): file is File => file !== null);

    if (pastedFiles.length === 0) return;

    e.preventDefault();
    await uploadSelectedFiles(pastedFiles);
  };

  const removePendingFile = (fileId: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeChatId) {
      setChats(prev => prev.map(chat =>
        chat.id === activeChatId
          ? { ...chat, files: chat.files.filter(f => f.id !== fileId) }
          : chat
      ));
    }
  };

  // ===== Send message =====
  const handleSend = async () => {
    if (isUploading || (!input.trim() && pendingFiles.length === 0) || !activeChatId || !selectedModel) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      files: pendingFiles.length > 0 ? [...pendingFiles] : undefined,
    };

    const currentInput = input.trim();
    const currentFiles = [...pendingFiles];
    setInput('');
    setPendingFiles([]);
    setIsLoading(true);
    setStreamingContent('');

    // Save user message to server (only for logged-in users)
    if (!isGuest) {
      try {
        await saveMessage(activeChatId, 'user', currentInput, currentFiles.length > 0 ? currentFiles : undefined);
      } catch (e) { console.error('Failed to save user message:', e); }

      // Update title if first message
      const chatForTitle = chats.find(c => c.id === activeChatId);
      if (chatForTitle?.title === 'New Chat' && currentInput) {
        const newTitle = currentInput.slice(0, 40) + (currentInput.length > 40 ? '...' : '');
        try { await updateChatSession(activeChatId, { title: newTitle }); } catch (e) { /* ignore */ }
      }
    }

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        const newMessages = [...chat.messages, userMessage];
        const title = chat.title === 'New Chat' 
          ? (currentInput.slice(0, 40) + (currentInput.length > 40 ? '...' : '') || 'File Upload')
          : chat.title;
        return { ...chat, messages: newMessages, title, updatedAt: Date.now() };
      }
      return chat;
    }));

    try {
      const currentChat = chats.find(c => c.id === activeChatId);
      const history = currentChat?.messages || [];
      
      const apiMessages = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: currentInput }
      ];

      const allChatFiles = [...(currentChat?.files || []), ...currentFiles];
      const uniqueFiles = allChatFiles.filter((f, i, arr) => arr.findIndex(x => x.id === f.id) === i);

      abortControllerRef.current = new AbortController();

      const response = await sendChatMessage(
        selectedModel.id,
        apiMessages,
        activeChatId,
        uniqueFiles.length > 0 ? uniqueFiles : undefined,
        abortControllerRef.current.signal
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let finalUsage: TokenUsage | null = null;

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                fullContent += delta.content;
                setStreamingContent(fullContent);
              }
              if (parsed.usage) {
                finalUsage = {
                  promptTokens: parsed.usage.prompt_tokens || 0,
                  completionTokens: parsed.usage.completion_tokens || 0,
                  totalTokens: parsed.usage.total_tokens || 0,
                };
              }
            } catch { /* skip */ }
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fullContent,
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          const prevUsage = chat.tokenUsage;
          const newUsage = finalUsage 
            ? {
                promptTokens: prevUsage.promptTokens + finalUsage.promptTokens,
                completionTokens: prevUsage.completionTokens + finalUsage.completionTokens,
                totalTokens: prevUsage.totalTokens + finalUsage.totalTokens,
              }
            : prevUsage;
          return { ...chat, messages: [...chat.messages, assistantMessage], tokenUsage: newUsage, updatedAt: Date.now() };
        }
        return chat;
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `**Error:** ${error.message || 'Failed to generate response.'}`,
      };
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) return { ...chat, messages: [...chat.messages, errorMessage], updatedAt: Date.now() };
        return chat;
      }));
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const stopGeneration = () => { abortControllerRef.current?.abort(); };

  const getChatModel = (chat: ChatSession) => models.find(m => m.id === chat.modelId) || selectedModel;

  const getVendorColor = (vendor: string) => {
    switch (vendor.toLowerCase()) {
      case 'anthropic': return 'text-orange-500';
      case 'google': return 'text-blue-500';
      case 'openai': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getVendorBadgeColor = (vendor: string) => {
    switch (vendor.toLowerCase()) {
      case 'anthropic': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'google': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'openai': return 'bg-green-500/10 text-green-600 dark:text-green-400';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const markdownComponents = {
    pre({ children }: any) {
      const codeProps = children?.props || {};
      const className = codeProps.className || '';
      const match = /language-(\w+)/.exec(className);
      const language = match ? match[1] : 'text';
      const value = String(codeProps.children).replace(/\n$/, '');
      return (
        <div className="my-4 overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800">
          <CodeBlock language={language} value={value} />
        </div>
      );
    }
  };

  if (!isAppReady) {
    return <InitScreen steps={initSteps} onRetry={runInit} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full flex-shrink-0 border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))] flex flex-col z-20 relative"
          >
            <div className="p-3">
              <button onClick={createNewChat} className="flex w-full items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm font-medium transition-colors hover:bg-[hsl(var(--muted))] active:scale-[0.98]">
                <Plus className="h-4 w-4" /> New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 pt-0">
              <div className="space-y-1">
                {chats.sort((a, b) => b.updatedAt - a.updatedAt).map(chat => (
                  <div key={chat.id} className={cn("group flex w-full items-center gap-2 rounded-lg p-3 text-sm transition-colors text-left", activeChatId === chat.id ? "bg-[hsl(var(--muted))] font-medium" : "hover:bg-[hsl(var(--muted))/0.5] text-[hsl(var(--muted-foreground))]")}>
                    <button onClick={() => { setActiveChatId(chat.id); setPendingFiles([]); if (window.innerWidth < 768) setIsSidebarOpen(false); }} className="flex items-center gap-2 flex-1 min-w-0">
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{chat.title}</span>
                      {chat.files.length > 0 && <Paperclip className="h-3 w-3 flex-shrink-0 text-[hsl(var(--muted-foreground))]" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 hover:text-red-500 transition-all flex-shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-[hsl(var(--sidebar-border))] space-y-1">
              {!isGuest && user?.role === 'admin' && (
                <button onClick={() => { window.location.href = '/admin'; }} className="flex w-full items-center gap-2 rounded-lg p-3 text-sm transition-colors hover:bg-[hsl(var(--muted))] text-amber-600 dark:text-amber-400">
                  <Shield className="h-4 w-4" /> Admin Panel
                </button>
              )}
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex w-full items-center gap-2 rounded-lg p-3 text-sm transition-colors hover:bg-[hsl(var(--muted))]">
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              {/* User info */}
              {isGuest ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-7 w-7 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-[hsl(var(--muted-foreground))] text-xs font-bold">G</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium">Guest</div>
                      <div className="text-[10px] text-[hsl(var(--muted-foreground))]">Đăng nhập để lưu chat</div>
                    </div>
                  </div>
                  <button onClick={() => { window.location.href = '/login'; }} className="flex w-full items-center gap-2 rounded-lg p-3 text-sm text-[hsl(var(--primary))] transition-colors hover:bg-[hsl(var(--muted))]">
                    <User className="h-4 w-4" /> Đăng nhập
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    {user!.avatar ? (
                      <img src={user!.avatar} alt="" className="h-7 w-7 rounded-full" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] text-xs font-bold">
                        {user!.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{user!.name}</div>
                      <div className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{user!.email}</div>
                    </div>
                  </div>
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg p-3 text-sm text-red-500 transition-colors hover:bg-red-500/10">
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col h-full relative min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-4 bg-[hsl(var(--background))]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="rounded-md p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            
            {/* Model Selector */}
            <div className="relative ml-2">
              <button onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)} disabled={isLoadingModels} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors disabled:opacity-50">
                {isLoadingModels ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Loading models...</>
                ) : (
                  <>
                    {selectedModel && <span className={cn("text-xs font-semibold", getVendorColor(selectedModel.vendor))}>{selectedModel.vendor}</span>}
                    {selectedModel?.name || 'Select Model'}
                    <ChevronDown className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  </>
                )}
              </button>
              
              <AnimatePresence>
                {isModelSelectorOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsModelSelectorOpen(false)} />
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute left-0 top-full mt-1 w-72 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1.5 shadow-xl z-40 max-h-[70vh] overflow-y-auto">
                      {Array.from(new Set(models.map(m => m.vendor))).map(vendor => (
                        <div key={vendor} className="mb-1 last:mb-0">
                          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[hsl(var(--muted-foreground))]">{vendor}</div>
                          {models.filter(m => m.vendor === vendor).map(model => (
                            <button key={model.id} onClick={() => { setSelectedModelId(model.id); if (activeChatId) { setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, modelId: model.id } : c)); updateChatSession(activeChatId, { model_id: model.id }).catch(() => {}); } setIsModelSelectorOpen(false); }} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-[hsl(var(--muted))] transition-colors">
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{(model.maxContextTokens / 1000).toFixed(0)}k context{model.supportsVision && ' • Vision'}</span>
                              </div>
                              {selectedModelId === model.id && <Check className="h-4 w-4 flex-shrink-0" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {activeChat && selectedModel && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
              {activeChat.files.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[10px] font-medium">
                  <Paperclip className="h-3 w-3" /> {activeChat.files.length} file{activeChat.files.length > 1 ? 's' : ''}
                </span>
              )}
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", getVendorBadgeColor(selectedModel.vendor))}>{selectedModel.vendor}</span>
            </div>
          )}
        </header>

        {/* Context Usage Bar */}
        {activeChat && selectedModel && (
          <div className="border-b border-[hsl(var(--border))]">
            <ContextUsageBar usage={activeChat.tokenUsage} maxContext={getChatModel(activeChat)?.maxContextTokens || selectedModel.maxContextTokens} />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-6 pb-32">
            {activeChat?.messages.length === 0 && !isLoading ? (
              <div className="flex h-[50vh] flex-col items-center justify-center text-center opacity-50">
                <Bot className="mb-4 h-12 w-12" />
                <h2 className="text-xl font-medium mb-2">How can I help you today?</h2>
                {selectedModel && <p className="text-sm text-[hsl(var(--muted-foreground))]">Using {selectedModel.name} ({(selectedModel.maxContextTokens / 1000).toFixed(0)}k context)</p>}
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Upload files with 📎 to analyze and work with them</p>
              </div>
            ) : (
              <>
                {activeChat?.messages.map((msg) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", msg.role === 'user' ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]")}>
                      {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    </div>
                    <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm", msg.role === 'user' ? "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]" : "bg-transparent")}>
                      {msg.role === 'user' ? (
                        <div>
                          {msg.files && msg.files.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {msg.files.map(f => <FileChip key={f.id} file={f} />)}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      ) : (
                        <div className="markdown-body w-full overflow-hidden">
                          <Markdown components={markdownComponents}>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && streamingContent && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"><Bot className="h-5 w-5" /></div>
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-transparent">
                      <div className="markdown-body w-full overflow-hidden">
                        <Markdown components={markdownComponents}>{streamingContent}</Markdown>
                        <span className="inline-block w-2 h-4 bg-[hsl(var(--foreground))] animate-pulse ml-0.5" />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {isLoading && !streamingContent && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"><Bot className="h-5 w-5" /></div>
                    <div className="flex items-center gap-1 px-4 py-3">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-2 w-2 rounded-full bg-[hsl(var(--muted-foreground))]" />
                    </div>
                  </motion.div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background))]/80 to-transparent p-4 pt-10">
          <div className="mx-auto max-w-3xl">
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm focus-within:ring-1 focus-within:ring-[hsl(var(--primary))] transition-shadow">
              {pendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30">
                  {pendingFiles.map(f => (
                    <FileChip key={f.id} file={f} onRemove={() => removePendingFile(f.id)} />
                  ))}
                </div>
              )}
              <div className="flex items-end">
                <div className="p-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="*/*" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex h-10 w-10 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors disabled:opacity-50" title="Upload files">
                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handleInputPaste}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedModel ? `Message ${selectedModel.name}...` : 'Loading models...'}
                  disabled={isLoadingModels}
                  className="max-h-[200px] min-h-[56px] w-full resize-none overflow-y-auto bg-transparent px-2 py-4 text-sm focus:outline-none disabled:opacity-50"
                  rows={1}
                />
                <div className="p-2">
                  {isLoading ? (
                    <button onClick={stopGeneration} className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white transition-transform hover:scale-105 active:scale-95" title="Stop generation">
                      <div className="h-3.5 w-3.5 rounded-sm bg-white" />
                    </button>
                  ) : (
                    <button onClick={handleSend} disabled={isUploading || (!input.trim() && pendingFiles.length === 0) || isLoadingModels} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100">
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-[hsl(var(--muted-foreground))]">
              AI can make mistakes. Consider verifying important information. Paste files/images with Ctrl/Cmd+V.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(loadDarkMode);
  const [user, setUser] = useState<UserInfo | null>(getStoredUser());
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
  }, [isDarkMode]);

  // Check auth on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      getMe()
        .then(u => setUser(u))
        .catch(() => setUser(null))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  if (!authChecked) {
    return (
      <div className={`flex h-screen w-full items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--foreground))] ${isDarkMode ? 'dark' : ''}`}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Chat app - guest mode allowed (user can be null)
  return <ChatApp user={user} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
}
