'use client';

import { useState, useCallback } from 'react';

type HoverZone = 'left' | 'center' | 'right';

interface SplitLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

/**
 * Norgram-style split layout. Mouse in left 40% → left expands.
 * Mouse in right 40% → right expands. Center 20% → balanced.
 */
export function SplitLayout({ left, right }: SplitLayoutProps) {
  const [zone, setZone] = useState<HoverZone>('center');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const w = e.currentTarget.clientWidth;
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const pct = x / w;
    if (pct < 0.4) setZone('left');
    else if (pct > 0.6) setZone('right');
    else setZone('center');
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZone('center');
  }, []);

  const leftFlex = zone === 'left' ? 1.8 : zone === 'right' ? 1 : 1;
  const rightFlex = zone === 'right' ? 1.8 : zone === 'left' ? 1 : 1;

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="min-w-0 overflow-hidden transition-[flex] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ flex: leftFlex }}
      >
        {left}
      </div>
      <div
        className="min-w-0 overflow-hidden transition-[flex] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ flex: rightFlex }}
      >
        {right}
      </div>
    </div>
  );
}
