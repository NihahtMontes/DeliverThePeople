import React, { createContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idCounter = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = idCounter.current++;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const { message, type, duration } = toast;
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onRemove();
    }, 300); // Wait for exit animation
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          progress: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          icon: <XCircle className="w-5 h-5 text-rose-500" />,
          progress: 'bg-rose-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: <AlertCircle className="w-5 h-5 text-amber-500" />,
          progress: 'bg-amber-500',
        };
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="w-5 h-5 text-blue-500" />,
          progress: 'bg-blue-500',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 min-w-[300px] max-w-sm rounded-xl shadow-lg border backdrop-blur-sm transform transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-x-12 scale-95' : 'opacity-100 translate-x-0 scale-100 animate-slide-in-right'
      } ${styles.bg}`}
    >
      <div className="shrink-0 mt-0.5">{styles.icon}</div>
      <div className="flex-1">
        <p className="font-medium text-sm leading-relaxed">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none rounded-full hover:bg-black/5 p-1 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Progress bar visual cue */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-xl overflow-hidden opacity-20">
           <div 
            className={`h-full ${styles.progress}`} 
            style={{ 
              animation: `shrink-width ${duration}ms linear forwards` 
            }}
          />
        </div>
      )}
      
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};
