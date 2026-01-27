# Debug-sessie – Admin login & sessie

## Snel starten

1. **Start de dev-server**: `npm run dev`
2. **Ga naar**: [http://localhost:3000/admin?debug=1](http://localhost:3000/admin?debug=1)
3. **Open DevTools**: F12 of Cmd+Option+I → tab **Console**
4. **Log in** (handmatig of “Inloggen als test admin”) en volg de logs.

## Wat je ziet met `?debug=1`

### Op de loginpagina (`/admin?debug=1`)

- Een gele **debug-banner** met link naar `/api/debug/auth`
- In de **Console**:
  - `[Admin Login] session check 200 -> redirect dashboard` of `401 -> blijf op login`
  - Bij submit: `[Admin Login] submit 200 {...}` of foutstatus
  - Bij test-login: `[Admin Login] test-login 200 {...}` of foutstatus

### Op het dashboard (`/admin/dashboard?debug=1`)

- In de **Console**:
  - `[Admin Layout] pathname= /admin/dashboard -> check /api/auth/session`
  - `[Admin Layout] session 200 ok` of `401 -> redirect /admin`

### Auth-status API

Open **[/api/debug/auth](http://localhost:3000/api/debug/auth)** (zelfde origine als de site, dus met dezelfde cookies):

```json
{
  "cookiePresent": true,
  "cookieLength": 42,
  "env": {
    "hasSupabaseUrl": true,
    "hasAnonKey": true,
    "hasServiceRoleKey": true
  },
  "nodeEnv": "development"
}
```

- **cookiePresent: false** na login → cookie wordt niet gezet of niet meegestuurd (domein/pad, secure, sameSite).
- **cookiePresent: true** maar je komt toch op login → layout/session-check faalt (bv. `/api/auth/session` geeft 401).

## Typische issues

| Symptoom | Mogelijke oorzaak |
|----------|-------------------|
| Direct terug naar login na inloggen | Cookie niet gezet of niet meegestuurd; of layout ziet sessie niet (zie Console + `/api/debug/auth`). |
| `[Admin Layout] session 401 -> redirect /admin` | Cookie ontbreekt in het request naar `/api/auth/session` (zelfde domein/port, geen incognito-blokkering). |
| Login API 401 | Verkeerde inloggegevens of test-admin niet aangemaakt (`npm run create-test-admin`). |
| `hasServiceRoleKey: false` | `SUPABASE_SERVICE_ROLE_KEY` ontbreekt in `.env.local`; admin-users kunnen niet gecontroleerd worden. |

## Alleen in development

`/api/debug/auth` geeft in **production** een 404. Console-logs staan alleen aan als je `?debug=1` in de URL hebt.
