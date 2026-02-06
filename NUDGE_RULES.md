# NUDGE — Backend-Safety & Minimal-Change Rules

Je voert wijzigingen door op een bestaande productiecodebase met werkende backend, dashboards en interne systemen.

---

## 1) PRIMAIRE DOELSTELLING: NIETS KAPOT MAKEN

De bestaande backend, admin dashboard, leadflow, offerte builder, automatisaties, rollen/rechten, reporting en alle bestaande integraties moeten 100% blijven werken.

- Je mag geen breaking changes introduceren zonder expliciet een compatibiliteitslaag.
- Alles wat je wijzigt moet backward compatible zijn, tenzij het echt onmogelijk is.

---

## 2) MINIMAL CHANGE POLICY

Verander alleen code als het nodig is.

- Als iets al werkt: raak het niet aan.
- Focus op: copy/content, layout/UX, styling, component additions, isolated changes.
- Niet op het herschrijven van bestaande logica.

---

## 3) NO ACCIDENTAL DELETION (ZERO TOLERANCE)

Verwijder nooit code "omdat het lijkt unused".

- Geen "dead code removal" zonder bewijs.
- Geen bestanden, exports, routes, API endpoints, hooks, services, types, helpers, env vars of databasevelden verwijderen tenzij:
  - je 100% zeker bent dat het nergens wordt aangeroepen
  - je alle referenties gevonden hebt
  - je een veilige migratie/alternatief hebt
- Als je twijfelt: laat het staan.

---

## 4) VEILIGE REFACTOR REGELS

Als je refactort:

- Alleen kleine, lokale refactors (1 module/feature tegelijk).
- Nooit grote "cleanup sweeps".
- Behoud bestaande: function signatures, public interfaces, route paths, database schema (tenzij expliciet gevraagd), response formats.
- Vermijd "clever" abstractions. Kies duidelijkheid boven elegantie.

---

## 5) CONTRACT-FIRST (API/UI)

- Backend endpoints en response shapes zijn een contract.
- Frontend calls moeten blijven werken zonder aanpassingen, tenzij je ook een compat layer toevoegt.
- UI flows (lead → opvolging → offerte → mail) moeten identiek blijven qua werking.

---

## 6) DEPENDENCIES & UPGRADES

- Geen dependency upgrades "omdat het beter is".
- Geen framework upgrades.
- Alleen nieuwe dependencies toevoegen als het absoluut nodig is en geen security/compat risico toevoegt.
- Prefer: native oplossingen boven extra packages.

---

## 7) DATA & SECURITY

- Nooit productiegegevens loggen.
- Nooit secrets hardcoden.
- Behoud env var usage.
- Respecteer rol- & rechtenbeheer.
- Elke wijziging moet security-neutral of security-positive zijn.

---

## 8) CLEAN CODE (MAAR STRIKT)

Schrijf clean, leesbare code: kleine functies, duidelijke namen, consistente formatting, geen duplicatie waar het evident is.

Maar: "clean" mag nooit een excuus zijn voor grote refactors.

Streng op: null/undefined handling, error handling, edge cases, input validation (zeker bij forms/admin).

---

## 9) TEST & VERIFICATIE CHECKLIST (VERPLICHT)

Voor elke change moet je verifiëren dat dit nog werkt:

- login / auth
- lead capture → admin lead list
- lead status updates
- call/bel-overzicht flow
- klantoverzicht
- analyse/rapportering
- offerte builder: prijslogica, PDF generatie, versturen mail, status (sent/viewed/accepted) indien aanwezig
- user management (rollen/rechten)
- automatisatie emails

Als je iets niet kan verifiëren: wijzig het niet, of voeg een compatibele safeguard toe.

---

## 10) CHANGELOG DISCIPLINE

Bij elke PR/commit: beschrijf exact wat veranderd is, waarom, welke bestanden, welk risico, hoe getest (stappen).

---

## 11) WEES STRENG BIJ ONZEKERHEID

Als je niet zeker bent of iets gebruikt wordt:

- zoek referenties
- check imports/exports/routes
- check runtime usage
- pas pas aan als je zekerheid hebt

Geen gokken.

---

## Samenvattende wet

**Preserve behavior. Minimize change. Avoid deletion. Additive improvements only.**
