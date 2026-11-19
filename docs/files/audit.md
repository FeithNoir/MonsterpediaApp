# Audit — MonsterpediaApp

**Date:** 2026-11-19  
**Method:** Dependency install, `ng serve` + production `ng build`, code review, browser walkthrough on `http://localhost:4200`, Performance resource inspection, screenshot capture.  
**Stack audited:** Local Supabase migration working tree (Firebase removed from `src/`; packages still listed).  
**Screenshots:** [`docs/screenshots/`](../screenshots/)

Severity: **P0** blocker / broken core journey · **P1** major functional or security · **P2** quality / a11y / maintainability · **P3** polish.

---

## Executive summary

The product idea (vintage monster encyclopedia with roles and contributions) is clear, but the **reading journey is broken for visitors**: the wiki index requires login, and every “read more” path opens the **editor** route (also gated). Live data fetch to Supabase returned `responseStatus: 0` from the browser (failed network/CORS-style failure), so home stays empty with stuck loading copy. Design has a promising brown/parchment intent but reads as generic Tailwind + PrimeIcons on a flat brown field, with fonts never loaded. Test coverage is effectively zero; production bundle already exceeds budgets; auth error handling and several RLS/permission paths still reflect a half-finished Firebase → Supabase move.

---

## A) Regular user findings

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| U1 | P0 | **Cannot read encyclopedia entries as a visitor.** Wiki and entry URLs redirect to login. There is no public article page. | Navigate `#/wiki-articles` or `#/entry/test-id` → lands on `#/auth`. Screens: `06-wiki-requires-auth.png`, `07-entry-deep-link-requires-auth.png`. Routes in `app.routes.ts`. |
| U2 | P0 | **Home shows no specimens; loading never resolves for bulletin/article.** Article of the Day empty; “Cargando datos…” / “Cargando entrada…” remain. | `01-home.png`, `02-home-full.png`. Empty-array / failed-fetch paths in `bulletin-board` and `monster-article` never set a finished empty state. |
| U3 | P0 | **Supabase REST calls fail in the browser** (`responseStatus: 0`, `transferSize: 0`, empty protocol) — content cannot load even if the DB has rows. | CDP `performance.getEntriesByType('resource')` on home; many duplicate `.../rest/v1/entries?...` entries. |
| U4 | P1 | **“Leer más” / card clicks go to the editor, not a reader** (confusing even for logged-in users). | `article-of-the-day.viewArticle`, `see-more-articles.viewArticle`, `wiki-articles.viewEntry` all `navigate(['/entry', id])`. |
| U5 | P1 | **Header “Sugerir” goes to Auth**, not “suggest a species” / create flow. Unauthenticated users hit a login wall with no explanation. | `header.component.ts` `navigateToAuth()`. |
| U6 | P1 | **No search on the public home**; wiki search exists but is behind auth. | Home snapshot has no search control; wiki gated. |
| U7 | P2 | **Article of the Day is random per load**, not a stable daily feature. | Random index in `article-of-the-day.component.ts`. |
| U8 | P2 | **Mixed language / branding**: UI Spanish, document title `MonsterpediaApp`, hero talks “chicas monstruo” without onboarding. | `index.html`, home hero, screenshots. |
| U9 | P2 | Mobile header collapses to hamburger (good), but first impression remains empty brown + empty featured card. | Home mobile interactive snapshot (hamburger `button` only). |

---

## B) Expert QA / engineering findings

### Functional & routing

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| Q1 | P0 | No public reader deep link; hash URLs for articles are not shareable as content pages. | `app.routes.ts` — only `/entry/:id` (guarded editor). |
| Q2 | P1 | `authGuard` / `roleGuard` race: `BehaviorSubject` starts `null`; cold refresh on guarded routes can redirect to `/auth` before `getSession()` resolves. `roleGuard` lacks `take(1)`. | `auth.service.ts`, `auth.guard.ts`, `role.guard.ts`. |
| Q3 | P1 | Auth component still branches on **Firebase error codes** (`auth/invalid-credential`, …) after Supabase migration → users see generic errors. | `auth.component.ts` `submit()`. |
| Q4 | P1 | Image “upload” stores **local file names only**; no Supabase Storage; wiki `<img [src]="entry.images[0]">` will 404. | `entry.component.ts` `onFileSelected`. |
| Q5 | P1 | Dashboard exposes **Delete** to every USER who can open it; RLS may reject non-admins, but UX lies and PermissionsService unused. | `dashboard.component.html` always shows trash button. |
| Q6 | P2 | Threat level UI inconsistent: bulletin `/5`, elsewhere `/10`. | `bulletin-board.component.html` vs dashboard/entry. |
| Q7 | P2 | Typo `clasification` / `mosterGirlData` preserved in API + UI. | Interfaces + bulletin component. |
| Q8 | P2 | Wildcard `**` → `home` hides 404s; bad deep links look like a soft home redirect. | `app.routes.ts`. |
| Q9 | P2 | Markdown tags on home are non-functional (`href="#"` + `preventDefault`). | `monster-article.component.html`. |
| Q10 | P2 | Duplicate `getEntries()` from service ctor + every widget → burst of identical failed requests (21 observed). | Home Performance resource list. |

### Auth, roles, security (RLS replaces Firestore rules)

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| S1 | P1 | INSERT RLS allows any authenticated **active** user; does not enforce USER/ADMIN role claimed in README matrix. | `supabase-schema.sql` insert policy. |
| S2 | P1 | Profile UPDATE policy allows updating **own row without locking `role` / `is_active` columns** — privilege fields should be server-only. | `supabase-schema.sql` profiles UPDATE. |
| S3 | P1 | Approval / user-management features listed in README matrix are **not implemented** (PermissionsService stubs only). | No admin UI routes. |
| S4 | P2 | `SupabaseService` hard-imports `environment.development` → production `replace-env.js` may not affect runtime client. | `supabase.service.ts`. |
| S5 | P2 | `authInterceptor` targets Angular `HttpClient`; Supabase JS uses `fetch` — interceptor is mostly dead code / false safety. | `auth.interceptor.ts`, `app.config.ts`. |
| S6 | P2 | Password reset `redirectTo` uses path `/reset-password` while app uses **HashLocationStrategy** (`/#/reset-password`) — email links may miss the SPA route. | `auth.service.ts` `forgotPassword`. |
| S7 | P3 | Leftover `@angular/fire` / `firebase` dependencies increase supply-chain surface after migration. | `package.json` vs zero Firebase imports under `src/`. |

### Editor, revisions, conflicts

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| E1 | P1 | No revision history, drafts, optimistic locking, or conflict detection — last write wins. | Schema has only `updated_at`; no revisions table. |
| E2 | P1 | Editor is a plain textarea for “markdown” content — no preview, toolbar, or sanitization policy beyond ngx-markdown on home. | `entry.component.html`. |
| E3 | P2 | Create sends client-generated `uuid`; edit overwrites `date` with `new Date()` (mutates original publish date semantics). | `entry.component.ts` `onSubmit`. |
| E4 | P2 | No dirty-form guard; navigating away loses work. | Entry component has no `CanDeactivate`. |

### Search, SEO, a11y, performance

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| P1a | P1 | SEO weak: hash routing, title `MonsterpediaApp`, no description/OG/Twitter/canonical, no per-article meta. | `index.html`, `HashLocationStrategy`. |
| P1b | P1 | Client-only search; no query param (`?q=`), no server FTS, no tag facet URLs. | `wiki-articles.component.ts`. |
| A1 | P1 | Accessibility: many clickable `<div>`/`<article>`/`<a>` without `href`/keyboard handlers; icon-only controls lack names. | Wiki cards `(click)`; header logo `(click)`; password toggle. Snapshot on auth lacks labeled associations for some controls. |
| A2 | P1 | Contrast: muted “Cargando…” gray on brown fails readable contrast. | `02-home-full.png`. |
| A3 | P2 | `lang="en"` while UI is Spanish — wrong language for AT. | `index.html`. |
| A4 | P2 | Decorative pins / images: bulletin uses static alt based on name when loaded; empty states not announced as status. | Templates. |
| Perf1 | P2 | Production initial bundle **620 KB** > **500 KB** budget warning; multiple CSS budget warnings. | `npm run build` output. |
| Perf2 | P2 | No Lighthouse CI; manual Lighthouse not run in CI. Expected poor SEO/a11y scores given hash + empty content + contrast. | No lighthouse config in repo. |
| Perf3 | P2 | Fonts referenced but not loaded → FOIT/FOUT irrelevant; branding fails silently. | No Google Fonts / `@font-face`. |

### Tests, dependencies, deploy readiness

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| T1 | P1 | **No unit/e2e coverage** for app logic (`skipTests: true` schematics; no app specs found). | `angular.json` schematics; glob `*.spec.ts` under app empty. |
| T2 | P2 | Angular 19 / Firebase 11 leftovers / Supabase 2.x — migration incomplete; upgrade path should finish Supabase cleanup before Angular 20+. | `package.json`. |
| T3 | P2 | Deploy workflow exists and looks coherent, but runtime env import bug (S4) and CORS/Site URL must be verified or Pages deploy will show empty home like local. | `.github/workflows/deploy.yml`, live fetch failure. |
| T4 | P3 | README still lists ESLint as a tool; no lint npm script. | `package.json` scripts vs README. |

---

## C) Design-taste verdict

**Verdict:** Directionally right (warm parchment + pins + scholarly Spanish copy), but **execution still reads as a generic Tailwind/PrimeNG CRUD shell** on a flat brown background. Distinctive typefaces are declared and never loaded; empty states use inbox/spinner metaphors; threat badges and card grids could belong to any admin wiki. It does **not** yet feel like a hand-crafted monster dossier — more like an early themed template. See `design.md` for a concrete handcrafted direction.

Evidence: `01-home.png`, `03-auth-login.png`, `05-reset-password.png` (auth has pins; reset is bare; home lacks specimen art).

---

## Screenshot index

| File | What it shows |
|---|---|
| `01-home.png` | First viewport: brand, hero, empty Article of the Day |
| `02-home-full.png` | Full home empty/loading failure state |
| `03-auth-login.png` | Login card (pinned board metaphor) |
| `04-auth-register.png` | Register mode |
| `05-reset-password.png` | Unstyled reset flow |
| `06-wiki-requires-auth.png` | Visiting wiki while logged out → auth |
| `07-entry-deep-link-requires-auth.png` | Visiting `/entry/:id` while logged out → auth |
| `08-auth-narrow.png` | Auth at narrow width |

Editor, dashboard, profile, and populated wiki grids **could not be captured with real data** in this session (API failure + no authenticated session). Their structure was reviewed in source (`entry.component.html`, `dashboard.component.html`, `wiki-articles.component.html`, `profile.component.html`).

---

## Top 10 findings (priority order)

1. **P0 — No public article reader; “read” navigates to gated editor.**  
2. **P0 — Wiki index requires authentication.**  
3. **P0 — Live entries API fails in browser (`responseStatus: 0`); home empty + stuck loaders.**  
4. **P1 — Image upload does not upload (names only).**  
5. **P1 — Auth/role guard session race; Firebase error handling left behind.**  
6. **P1 — RLS/permission matrix mismatches (insert role, profile privilege columns, delete UI).**  
7. **P1 — No revision history / conflict handling for a wiki editor.**  
8. **P1 — SEO/meta nearly absent (hash routing + generic title).**  
9. **P1 — Accessibility gaps (non-link navigation, contrast, `lang`).**  
10. **P1/P2 — Design unfinished: fonts unloaded, generic icons, inconsistent surfaces; bundle budgets already warning.**
