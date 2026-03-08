'use client';

import { useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 200;

export function useScrollPosition(): { isScrolled: boolean; scrollY: number } {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY ?? 0);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return {
    isScrolled: scrollY > SCROLL_THRESHOLD,
    scrollY,
  };
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
