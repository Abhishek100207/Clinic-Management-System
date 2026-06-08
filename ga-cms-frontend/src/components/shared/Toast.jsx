/* eslint-disable react-hooks/immutability */
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({ type = 'info', message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toastActions = React.useMemo(() => {
    const fn = (opts) => toast(opts);
    fn.success = (msg, opts) => fn({ type: 'success', message: msg, ...opts });
    fn.error   = (msg, opts) => fn({ type: 'error',   message: msg, ...opts });
    fn.warning = (msg, opts) => fn({ type: 'warning', message: msg, ...opts });
    fn.info    = (msg, opts) => fn({ type: 'info',    message: msg, ...opts });
    return fn;
  }, [toast]);

  return (
    <ToastContext.Provider value={toastActions}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ─── Visual config per type ──────────────────────────────────────────────────
const CONFIG = {
  success: {
    icon: CheckCircle2,
    bar:  'bg-emerald-500',
    bg:   'bg-white border-l-4 border-emerald-500',
    icon_cls: 'text-emerald-500',
    title: 'Success',
  },
  error: {
    icon: XCircle,
    bar:  'bg-red-500',
    bg:   'bg-white border-l-4 border-red-500',
    icon_cls: 'text-red-500',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bar:  'bg-amber-500',
    bg:   'bg-white border-l-4 border-amber-500',
    icon_cls: 'text-amber-500',
    title: 'Warning',
  },
  info: {
    icon: Info,
    bar:  'bg-blue-500',
    bg:   'bg-white border-l-4 border-blue-500',
    icon_cls: 'text-blue-500',
    title: 'Info',
  },
};

// ─── Container ───────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onDismiss }) => (
  <div
    aria-live="polite"
    className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    style={{ maxWidth: '380px', width: '90vw' }}
  >
    {toasts.map(t => (
      <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
    ))}
  </div>
);

// ─── Single toast ────────────────────────────────────────────────────────────
const ToastItem = ({ toast: t, onDismiss }) => {
  const cfg = CONFIG[t.type] || CONFIG.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`
        pointer-events-auto w-full rounded-xl shadow-xl shadow-black/10
        ${cfg.bg} overflow-hidden
        animate-in slide-in-from-right-4 fade-in duration-300
      `}
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        <Icon size={20} className={`flex-shrink-0 mt-0.5 ${cfg.icon_cls}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-black uppercase tracking-widest mb-0.5 ${cfg.icon_cls}`}>
            {cfg.title}
          </p>
          <p className="text-sm text-slate-700 font-medium leading-snug break-words">
            {t.message}
          </p>
        </div>
        <button
          onClick={() => onDismiss(t.id)}
          className="flex-shrink-0 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
      {/* Animated progress bar */}
      <div className="h-0.5 w-full bg-slate-100">
        <div
          className={`h-full ${cfg.bar} animate-shrink`}
          style={{ animation: 'shrink 4s linear forwards' }}
        />
      </div>
      <style>{`
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
};

export default ToastProvider;
