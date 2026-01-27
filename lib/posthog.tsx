'use client';

import React, { useEffect } from 'react';
import posthog, { type PostHogInterface } from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

const posthogOptions = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  capture_pageview: true,
  capture_pageleave: true,
  disable_session_recording: false,
  loaded: (_ph: PostHogInterface) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PostHog loaded (session recording + scroll depth actief)');
    }
  },
};

if (typeof window !== 'undefined') {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (posthogKey) {
    posthog.init(posthogKey, posthogOptions);
  }
}

const SCROLL_DEPTH_MARKS = [25, 50, 75, 100] as const;

function ScrollDepthTracker() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === 'undefined') return;

    const seen = new Set<number>();
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const max = scrollHeight - clientHeight;
      if (max <= 0) return;
      const percent = Math.round((scrollTop / max) * 100);

      for (const mark of SCROLL_DEPTH_MARKS) {
        if (percent >= mark && !seen.has(mark)) {
          seen.add(mark);
          posthog?.capture('scroll_depth', { depth_percent: mark });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return null;
}

export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!posthogKey) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={posthogKey}
      options={posthogOptions}
    >
      <ScrollDepthTracker />
      {children}
    </PostHogProvider>
  );
}

export { posthog };
