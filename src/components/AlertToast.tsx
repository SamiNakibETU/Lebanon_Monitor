'use client';

import { useEffect } from 'react';

interface AlertToastProps {
  message: string;
  severity: 'critical' | 'high';
  onDismiss: () => void;
  durationMs?: number;
}

export function AlertToast({ message, severity, onDismiss, durationMs = 5000 }: AlertToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  const bg = severity === 'critical' ? 'rgba(185,28,28,0.9)' : 'rgba(122,81,99,0.9)';

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-[100] max-w-sm px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-2"
      style={{
        background: bg,
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-white/80 hover:text-white text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
