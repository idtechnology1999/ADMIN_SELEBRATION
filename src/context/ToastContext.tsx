import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const STYLES = {
  success: { border: '#1CB957', icon: '#1CB957', bg: '#F0FDF4' },
  error:   { border: '#EF4444', icon: '#EF4444', bg: '#FFF5F5' },
  warning: { border: '#F5820A', icon: '#F5820A', bg: '#FFF8F0' },
  info:    { border: '#3B82F6', icon: '#3B82F6', bg: '#EFF6FF' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = ICONS[toast.type];
  const s = STYLES[toast.type];

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl shadow-lg min-w-72 max-w-sm animate-fade-up"
      style={{ background: s.bg, border: `1px solid ${s.border}20` }}
    >
      <Icon size={18} style={{ color: s.icon, flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
        {toast.message && <p className="text-xs text-gray-600 mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toast = {
    success: (title: string, message?: string) => add('success', title, message),
    error:   (title: string, message?: string) => add('error', title, message),
    warning: (title: string, message?: string) => add('warning', title, message),
    info:    (title: string, message?: string) => add('info', title, message),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
