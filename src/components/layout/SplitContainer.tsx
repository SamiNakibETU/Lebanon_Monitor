'use client';

import { Children, useState, type ReactNode } from 'react';

export type SplitMode = 'split' | 'lumiere' | 'ombre' | 'twothirds';

interface SplitContainerProps {
  mode: SplitMode;
  children: ReactNode;
}

/**
 * V3 — Split view Lumière / Ombre à la Norgram.
 * 50/50 par défaut. Hover = 65/35. Modes: ☀️ ◐ 🌙 ⅔
 * React state fallback for hover (CSS :has() not supported in all browsers).
 */
export function SplitContainer({ mode, children }: SplitContainerProps) {
  const [hoveredPanel, setHoveredPanel] = useState<'lumiere' | 'ombre' | null>(null);

  const isSplit = mode === 'split';
  const isTwothirds = mode === 'twothirds';
  const lumiereFlex = isTwothirds ? 2 : isSplit && hoveredPanel === 'lumiere' ? 1.85 : isSplit && hoveredPanel === 'ombre' ? 1 : 1;
  const ombreFlex = isTwothirds ? 1 : isSplit && hoveredPanel === 'ombre' ? 1.85 : isSplit && hoveredPanel === 'lumiere' ? 1 : 1;

  const arr = Children.toArray(children);
  const [lumiereChild, dividerChild, ombreChild] = arr;

  return (
    <div
      className="split-container flex w-full overflow-hidden"
      style={{ height: 'calc(100vh - 48px)' }}
      data-mode={mode}
    >
      <div
        style={{ flex: lumiereFlex, minWidth: 0, display: 'flex' }}
        onMouseEnter={() => isSplit && setHoveredPanel('lumiere')}
        onMouseLeave={() => isSplit && setHoveredPanel(null)}
      >
        {lumiereChild}
      </div>
      {dividerChild}
      <div
        style={{ flex: ombreFlex, minWidth: 0, display: 'flex' }}
        onMouseEnter={() => isSplit && setHoveredPanel('ombre')}
        onMouseLeave={() => isSplit && setHoveredPanel(null)}
      >
        {ombreChild}
      </div>
    </div>
  );
}
