'use client';

import type { ReactNode } from 'react';

export type SplitMode = 'split' | 'lumiere' | 'ombre' | 'twothirds';

interface SplitContainerProps {
  mode: SplitMode;
  children: ReactNode;
}

/**
 * V3 — Split view Lumière / Ombre à la Norgram.
 * 50/50 par défaut. Hover = 65/35. Modes: ☀️ ◐ 🌙 ⅔
 */
export function SplitContainer({ mode, children }: SplitContainerProps) {
  return (
    <div
      className="split-container flex w-full overflow-hidden"
      style={{
        height: 'calc(100vh - 48px)',
      }}
      data-mode={mode}
    >
      {children}
    </div>
  );
}
