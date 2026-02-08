# Security Rules (Hard Requirements)

**These rules MUST be followed in this project and in all future work.** Treat them as non-negotiable.

## 1. Authentication & Sessions

- **Never implement custom auth/session/JWT unless explicitly requested.**
- Use established providers (e.g. NextAuth, Supabase Auth, Clerk) when auth is needed.
- Do not invent or hand-roll JWT logic, session storage, or auth flows.

## 2. Data Access & Authorization

- **All data access must be server-side** (API routes, Server Components, server actions).
- **Every data access must enforce authorization checks** (e.g. user role, tenant, ownership).
- Do not expose raw DB access or internal IDs to the client without authorization.

## 3. Request Validation

- **Validate every request with a strict schema** (e.g. Zod, Yup).
- **Reject unknown fields**, use `.strict()` or equivalent; do not allow extra properties.
- Validate types, lengths, and formats. Fail closed on invalid input.

## 4. Secrets & Logging

- **Never place secrets in client code** (no API keys, tokens, or DB URLs in browser bundles).
- **Never log secrets** (passwords, tokens, API keys). Redact or omit in logs.
- Use environment variables and server-only code for secrets.

## 5. Database & Queries

- **Use parameterized queries / ORM only.** Never concatenate or interpolate user input into SQL.
- Prefer an ORM (e.g. Prisma, Drizzle) or a client that supports parameterized queries (e.g. Supabase client).

## 6. Rate Limiting

- **Add rate limiting to public endpoints** (e.g. login, signup, contact, lead submission).
- Use middleware or a dedicated solution (e.g. Upstash, Vercel KV, or framework built-ins).

## 7. Tests for Authorization

- **Add tests for authorization: at least 3 per protected route.**
  - Unauthenticated request → 401/403 or redirect.
  - Wrong user/role → 403 or no data.
  - Correct user/role → success.
- Prefer automated tests (e.g. Jest, Vitest, Playwright for E2E).

## 8. When Unsure

- **If unsure, stop and propose the safest default.**
- Prefer deny over allow, validation over trust, and server-side over client-side.
- Document assumptions and get explicit approval before weakening any rule.

## 9. No Emojis

- **Never use emojis in code, UI, or any project content.**
- Use text, icons (e.g. Lucide icons), or other visual elements instead.
- This applies to all code, components, messages, placeholders, and documentation.

---

*Last updated: 2025-01-27. These rules override any conflicting local conventions.*
