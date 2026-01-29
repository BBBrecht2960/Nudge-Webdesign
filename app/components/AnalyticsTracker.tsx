'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

const SCROLL_DEPTH_MARKS = [25, 50, 75, 100] as const;

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    track('$pageview', { path: pathname ?? window.location.pathname });
  }, [pathname]);

  useEffect(() => {
    const seen = new Set<number>();
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      if (max <= 0) return;
      const percent = Math.round((scrollTop / max) * 100);
      for (const mark of SCROLL_DEPTH_MARKS) {
        if (percent >= mark && !seen.has(mark)) {
          seen.add(mark);
          track('scroll_depth', { depth_percent: mark });
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}
