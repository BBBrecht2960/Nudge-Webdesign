# PostHog – connectie en tracking

## Is PostHog verbonden?

PostHog staat **alleen aan** als deze variabelen in `.env.local` staan:

```env
NEXT_PUBLIC_POSTHOG_KEY=<jouw_project_api_key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

- **Project API Key**: PostHog → Project Settings → Project API Key.
- **Host**: standaard `https://us.i.posthog.com`; voor EU: `https://eu.i.posthog.com` (als je die ingesteld hebt).

Zonder `NEXT_PUBLIC_POSTHOG_KEY` worden **geen** events naar PostHog gestuurd; de app werkt wel normaal.

**Controleren in development:**  
Open de site, F12 → Console. Als PostHog geladen is, zie je: `PostHog loaded (session recording + scroll depth actief)`.

---

## Wat wordt er getracked?

### Automatisch (posthog-js)

| Wat | Standaard |
|-----|-----------|
| **Page views** | Ja (`capture_pageview: true`) |
| **Page leave** | Ja (`capture_pageleave: true`) |
| **Autocapture** | Ja – clicks op links, buttons, forms, inputs, etc. |

### Custom events (in onze code)

| Event | Waar |
|-------|------|
| `cta_click` | Hero, FinalCTA, PackagesPreview |
| `package_card_click` | Klik op pakketkaart |
| `faq_expanded` | FAQ-item opengeklapt |
| `form_started` | Eerste interactie met leadformulier |
| `form_submitted` | Leadformulier verzonden + `identify(email)` |
| `sticky_cta_click` | “Plan gratis gesprek” in sticky balk (mobiel) |
| `phone_click` | Klik op telefoon-icoon (sticky balk) |
| `thank_you_page_view` | Bezoek aan /thanks |

| `scroll_depth` | Bij 25%, 50%, 75%, 100% scroll (property `depth_percent`) |

---

## Session recordings & scroll depth

- **Session replay** staat aan (`disable_session_recording: false`). Bekijk opnames in PostHog → Session Replay.
- **Scroll depth** – events `scroll_depth` met `depth_percent: 25 | 50 | 75 | 100`, per pagina elke drempel één keer.

## Kosten

- **Scroll depth:** max. 4 events per pageview; verwaarloosbaar.
- **Session recordings:** tellen mee in je PostHog-plan. Zie [PostHog Pricing](https://posthog.com/pricing). Later aan/uit zetten kost technisch niets extra.
