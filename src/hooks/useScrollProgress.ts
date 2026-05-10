import { useState, useEffect, useCallback } from 'react';

export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const windowH = window.innerHeight;
    const total = rect.height - windowH;
    const scrolled = -rect.top;
    const p = Math.max(0, Math.min(1, scrolled / total));
    setProgress(p);
  }, [ref]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return progress;
}
