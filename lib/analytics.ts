'use client';

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

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties: properties ?? {} }),
  }).catch(() => {});
}
