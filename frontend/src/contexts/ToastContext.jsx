import React, { createContext, useContext, useState, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorUtils';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    const toast = { id, message: getErrorMessage(message, 'Something went wrong.'), type, visible: true };
    setToasts(prev => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
      }, duration);
    }
    return id;
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error', 6000), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);
  const ai = useCallback((msg) => addToast(msg, 'ai'), [addToast]);

  const toast = useCallback((options, maybeType) => {
    if (typeof options === 'string') {
      return addToast(options, maybeType || 'info');
    }
    if (options && typeof options === 'object') {
      const msg = options.title || options.message || options.description || 'Notification';
      const variant = options.variant || options.type || maybeType || 'info';
      const duration = options.duration !== undefined ? options.duration : (variant === 'error' ? 6000 : 4000);
      return addToast(msg, variant, duration);
    }
    return addToast(String(options || ''), 'info');
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info, ai, toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center gap-2 ${
              toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            } ${
              toast.type === 'success' ? 'bg-green-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              toast.type === 'warning' ? 'bg-yellow-500 text-white' :
              toast.type === 'ai' ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <span className="text-sm">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'ai' && '🤖'}
              {toast.type === 'info' && 'ℹ'}
            </span>
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-white/80 hover:text-white ml-2">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
