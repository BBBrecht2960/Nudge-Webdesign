# Nudge Webdesign

Website van Nudge Webdesign, een webdesign agentschap. Gebouwd met Next.js App Router.

## Features

- **Marketing Site**: Conversion-optimized landing page with lead generation
- **Admin Dashboard**: Lead management system with analytics
- **Interne analytics**: Pageviews en events in eigen database (Admin → Analytics)
- **Lead Forms**: GDPR-compliant lead capture with UTM tracking
- **Responsive Design**: Mobile-first design with sticky CTA bar

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + custom components
- **Database**: Supabase (PostgreSQL)
- **Analytics**: Intern (Supabase)
- **Forms**: React Hook Form + Zod validation
- **Authentication**: NextAuth.js (for admin dashboard)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Option A: Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase-schema.sql`
3. Get your project URL and anon key from Settings > API

#### Option B: Neon

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Run `supabase-schema.sql` in the SQL editor
3. Get your connection string

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Authentication
NEXTAUTH_SECRET=your_random_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Admin user (initial setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=your_bcrypt_hashed_password
```

### 4. Analytics (optioneel)

Voer `scripts/analytics-events-table.sql` uit in Supabase SQL Editor. Daarna toont Admin → Analytics pageviews en events.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /components          # Reusable React components
  /api                # API routes
  /admin              # Admin dashboard (protected)
  /pakketten          # Packages page
  /over-ons           # About page
  /diensten           # Services page
  /proces             # Process page
  /contact            # Contact page
  /privacy            # Privacy policy
  /cookie-beleid      # Cookie policy
  /thanks             # Thank you page
/lib
  /db.ts              # Database client
  /posthog.ts         # PostHog client
  /utils.ts           # Utility functions
```

## Admin Dashboard

Access the admin dashboard at `/admin` (requires authentication).

Features:
- View all leads in a table
- Filter and search leads
- View lead details with status pipeline
- Add notes to leads
- Track lead status changes
- View analytics dashboard

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set all environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)

## Customization

### Colors

Edit `app/globals.css` to change the color scheme. The current theme uses a soft blue/gray palette.

### Content

- Landing page content: `app/page.tsx` and components in `app/components/`
- Package details: `app/pakketten/page.tsx`
- FAQ: `app/components/FAQ.tsx`

### Business Information

Update the following files with your business details:
- `app/layout.tsx` - Metadata
- `app/components/StickyMobileCTA.tsx` - Phone number
- Create JSON-LD structured data for LocalBusiness (see SEO section)

## SEO

### Metadata

Each page has its own metadata. Update in the page files.

### JSON-LD Structured Data

Add LocalBusiness structured data to the homepage for better local SEO. Example:

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Nudge Webdesign",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Your Street",
    "addressLocality": "Hasselt",
    "postalCode": "3500",
    "addressCountry": "BE"
  },
  "telephone": "+32XXXXXXXXX"
}
```

## Analytics

Analytics zijn intern: pageviews en events worden opgeslagen in de tabel `analytics_events` (Supabase). Voer eenmalig `scripts/analytics-events-table.sql` uit. Events: `$pageview`, `cta_click`, `form_submitted`, `package_card_click`, `scroll_depth`, `sticky_cta_click`, `phone_click`, `thank_you_page_view`, `faq_expanded`.

## Security

**Hard rules** for this project are defined in **[SECURITY_RULES.md](./SECURITY_RULES.md)**. They apply to all code and future work. Summary:

- No custom auth/session/JWT unless explicitly requested; use established providers.
- All data access server-side with authorization checks.
- Strict request validation (reject unknown fields).
- No secrets in client code; never log secrets.
- Parameterized queries / ORM only.
- Rate limiting on public endpoints.
- At least 3 authorization tests per protected route.
- When unsure: stop and propose the safest default.

[Cursor](https://cursor.com) users: these rules are also enforced via `.cursorrules` in the project root.

## License

Private - All rights reserved
