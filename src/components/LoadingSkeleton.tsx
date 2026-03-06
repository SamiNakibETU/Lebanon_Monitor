'use client';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

/**
 * Pulsing rectangle skeleton for loading states.
 */
export function LoadingSkeleton({ className = '', lines = 4 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-sm opacity-20 animate-pulse"
          style={{
            width: i === lines - 1 ? '60%' : '100%',
            background: 'currentColor',
          }}
        />
      ))}
    </div>
  );
}
