'use client';

export const DO_NOT_TRACK_KEY = 'nudge_do_not_track';

export type AnalyticsEvent =
  | '$pageview'
  | 'cta_click'
  | 'form_submitted'
  | 'package_card_click'
  | 'scroll_depth'
  | 'sticky_cta_click'
  | 'phone_click'
  | 'thank_you_page_view'
  | 'faq_expanded';

export function isDoNotTrack(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(DO_NOT_TRACK_KEY) === '1';
}

export function setDoNotTrack(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    localStorage.setItem(DO_NOT_TRACK_KEY, '1');
  } else {
    localStorage.removeItem(DO_NOT_TRACK_KEY);
  }
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  if (isDoNotTrack()) return;
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties: properties ?? {} }),
  }).catch(() => {});
}
