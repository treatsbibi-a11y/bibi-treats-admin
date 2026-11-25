'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
  faCircleInfo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastInput, 'title' | 'variant'>> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (input: ToastInput | string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let externalShowToast: ((input: ToastInput | string) => void) | null = null;

export function showToast(input: ToastInput | string) {
  if (externalShowToast) {
    externalShowToast(input);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const triggerToast = useCallback(
    (input: ToastInput | string) => {
      const normalized: ToastInput =
        typeof input === 'string' ? { title: input, variant: 'info' } : input;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = {
        id,
        title: normalized.title,
        description: normalized.description,
        variant: normalized.variant ?? 'info',
      };

      setToasts((prev) => [...prev.slice(-4), item]);

      const duration = normalized.duration ?? 3800;
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  useEffect(() => {
    externalShowToast = triggerToast;
    return () => {
      externalShowToast = null;
    };
  }, [triggerToast]);

  const variantMeta: Record<
    ToastVariant,
    { icon: typeof faCircleCheck; accentClass: string; iconBgClass: string }
  > = {
    success: {
      icon: faCircleCheck,
      accentClass: 'border-l-[3px] border-l-semantic-green',
      iconBgClass: 'text-semantic-green bg-semantic-green-lt',
    },
    error: {
      icon: faCircleExclamation,
      accentClass: 'border-l-[3px] border-l-semantic-red',
      iconBgClass: 'text-semantic-red bg-semantic-red-lt',
    },
    warning: {
      icon: faTriangleExclamation,
      accentClass: 'border-l-[3px] border-l-semantic-yellow',
      iconBgClass: 'text-semantic-yellow bg-semantic-yellow-lt',
    },
    info: {
      icon: faCircleInfo,
      accentClass: 'border-l-[3px] border-l-primary',
      iconBgClass: 'text-primary-text bg-primary-lt',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast: triggerToast, dismissToast }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none no-print"
      >
        {toasts.map((toast) => {
          const meta = variantMeta[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto bg-surface text-ink rounded-lg shadow-overlay border border-surface-border ${meta.accentClass} p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150`}
            >
              <div
                className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${meta.iconBgClass}`}
              >
                <FontAwesomeIcon icon={meta.icon} className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-[13px] font-semibold text-ink leading-snug">
                  {toast.title}
                </div>
                {toast.description && (
                  <div className="text-xs text-ink-secondary mt-0.5 leading-snug">
                    {toast.description}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-sm text-ink-muted hover:text-ink hover:bg-surface-secondary transition-colors shrink-0"
                aria-label="ปิดการแจ้งเตือน"
              >
                <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
