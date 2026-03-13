'use client';

export interface AnalystEmptyStateProps {
  message?: string;
  variant?: 'light' | 'dark';
}

export function AnalystEmptyState({
  message = "Aucun événement ni épisode lié pour l'instant.",
  variant = 'dark',
}: AnalystEmptyStateProps) {
  const color = variant === 'dark' ? '#666666' : '#888888';
  const borderColor = variant === 'dark' ? 'rgba(255,255,255,0.04)' : '#E0DCD7';

  return (
    <div
      className="mt-8 pt-6"
      style={{ borderTop: `1px solid ${borderColor}` }}
    >
      <p style={{ color, fontSize: 13 }}>{message}</p>
    </div>
  );
}
