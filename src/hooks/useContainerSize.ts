'use client';

import { useEffect, useState, type RefObject } from 'react';

export function useContainerSize(ref: RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(ref.current);
    setSize({
      width: ref.current.offsetWidth,
      height: ref.current.offsetHeight,
    });

    return () => observer.disconnect();
  }, [ref]);

  return size;
}
