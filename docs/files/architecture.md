# Architecture — MonsterpediaApp

**Audited:** 2026-11-19  
**Scope:** Local workspace as runnable (`ng serve` on `http://localhost:4200`).  
**Important stack note:** `origin/main` still contains a Firebase (`@angular/fire`) auth/data layer. The local working tree is mid-migration to **Supabase Auth + Postgres + RLS + Realtime**. This document describes the **code that actually ran during the audit** (Supabase path). Leftover Firebase packages remain in `package.json` but are unused under `src/`.

---

## 1. Product shape

Monsterpedia is a SPA “monster girl” encyclopedia with:

| Capability | Current implementation |
|---|---|
| Browse home / featured content | Home layout: hero, Article of the Day, bulletin board + markdown article, See More |
| Wiki index + client search | `/wiki-articles` (gated by `authGuard`) |
| Auth (login / register / reset) | Supabase Auth email+password |
| Roles | `visitor` / `user` / `admin` (JWT `app_metadata` + email confirmation) |
| Editor | `/entry` and `/entry/:id` (create/update form) |
| Dashboard | `/dashboard` list + edit/delete actions |
| Profile | `/profile` display name / photo URL / resend verification |

There is **no dedicated public article reader route**. Cards and “Leer más” navigate to `/entry/:id`, which is the **editor**, protected by auth + role guards.

---

## 2. Runtime stack

```
Browser (Angular 19 standalone SPA)
  ├─ HashLocationStrategy  (#/home, #/wiki-articles, …)
  ├─ Tailwind CSS v4 + design tokens in src/styles.css
  ├─ PrimeNG (auth InputGroup) + PrimeIcons
  ├─ ngx-markdown (home article body)
  └─ Services
       ├─ SupabaseService → @supabase/supabase-js client
       ├─ AuthService     → auth.signIn / signUp / reset / metadata
       └─ EntryService    → public.entries + Realtime channel
              ↓
         Supabase project (URL + anon key from environment)
              ├─ Auth
              ├─ Postgres (profiles, entries) + RLS
              └─ Realtime publication on entries/profiles
```

**Deploy path (documented / CI):** GitHub Actions → `replace-env.js` → `ng build --configuration production --base-href /MonsterpediaApp/` → GitHub Pages.

---

## 3. Application structure

```
src/app/
  auth/           AuthComponent, ResetPasswordComponent
  core/
    enums/        UserRole
    guards/       authGuard, roleGuard(allowedRoles)
    interceptors/ authInterceptor (HttpClient Bearer; unused by Supabase client)
    interfaces/   IUser, IEntry, auth DTOs
    services/     AuthService, EntryService, PermissionsService, SupabaseService
  pages/
    layout/       shell: sidebar + header + router-outlet
    home/         hero + featured sections + nested bulletin/article
    wiki-articles/
    dashboard/
    entry/        create/edit form (not a reader)
    profile/
  shared/         header, sidebar, article-of-the-day, see-more-articles, hero
```

Routing lives in `src/app/app.routes.ts`. Layout children include home (public), while wiki/dashboard/entry/profile are variously guarded.

---

## 4. Auth & roles

### Client mapping (`AuthService.mapSupabaseUser`)

1. If `app_metadata.role === 'admin'` → `ADMIN`
2. Else if `email_confirmed_at` set → `USER`
3. Else → `VISITOR`
4. `isActive` defaults true unless `app_metadata.is_active === false`

### Guards

- `authGuard`: `take(1)` on `isAuthenticated$`; unauthenticated → `/auth`
- `roleGuard([...])`: checks user presence, `isActive`, and role membership; failures → `/auth` or `/home`. **Does not `take(1)`**, so it can keep the Observable open.

### PermissionsService

UI-oriented helpers (`canCreateArticle`, `canEditArticle`, `canDeleteArticle`, …). Dashboard delete/edit buttons do **not** consult this service; they always render for authenticated users who reach the page.

### Server (RLS) — `supabase-schema.sql`

- `profiles`: SELECT open; UPDATE own row (no column restriction on `role` / `is_active`)
- `entries`: SELECT open; INSERT if `auth.uid() = author_id` and profile `is_active`; UPDATE owner or JWT admin; DELETE admin only
- Triggers sync `auth.users` → `profiles`
- Realtime enabled for `entries` and `profiles`

**Mismatch:** README permission matrix and Angular role guards expect only USER/ADMIN to create content, but INSERT RLS does not require `role in ('user','admin')`—any authenticated active session can insert.

---

## 5. Data model

### `profiles`

`id` (FK auth.users), `email`, `display_name`, `photo_url`, `role`, `is_active`, timestamps.

### `entries`

| DB column | App field | Notes |
|---|---|---|
| `id` | `id` | UUID |
| `name`, `description`, `species`, `alignment`, `longevity`, `content` | same | |
| `common_names` | `commonNames` | `text[]` |
| `clasification` | `clasification` | typo preserved end-to-end |
| `threat_level` | `threatLevel` | 0–10 check constraint |
| `images` | `images` | `text[]` of strings (currently local **file names**, not Storage URLs) |
| `author_id` | `author` | joined via `author:profiles(*)` |
| `tags` | `tags` | `text[]` |
| `date` | `date` | used for ordering |

No tables for **revisions**, **drafts/approval workflow**, **comments**, or **article-of-the-day schedule**.

---

## 6. Data flow

1. `EntryService` constructor calls `loadEntries()` and opens a Realtime channel that reloads on any change.
2. Home widgets (`article-of-the-day`, `bulletin-board`, `monster-article`, `see-more-articles`) each **also** call `getEntries()` independently → duplicate network load.
3. Selection is **random client-side** each load (not a stable “of the day”).
4. Wiki search filters the in-memory list by name / description / species / tags (no full-text search, no URL query sync).
5. Editor builds `IEntry` from a reactive form; comma-separated fields are split to arrays; images take `File.name` only.

### Environment wiring risk

`SupabaseService` imports **`environment.development`** directly. Production `replace-env.js` rewrites `environment.ts`, but the service never reads that file → production builds can keep pointing at the development project.

---

## 7. Frontend concerns

| Area | Current state |
|---|---|
| Change detection | Zone.js + signals in several pages |
| Forms | Reactive (entry, profile); template-driven signals (auth) |
| i18n | Spanish UI strings; English README/docs; `index.html lang="en"` |
| Tests | Angular schematics `skipTests: true`; no meaningful `*.spec.ts` under `src/app` |
| Lint | No ESLint script in `package.json` |
| SEO | Hash routing; static `<title>MonsterpediaApp</title>`; no meta/OG tags; route `title` only |
| Images | `public/lamia.jpg` hardcoded in bulletin board; upload path not using Supabase Storage |

---

## 8. Build & budgets

`npm run build` succeeds. Production warnings observed:

- Initial bundle **620 KB** vs budget warning **500 KB**
- Several component CSS files exceed **4 KB** anyComponentStyle budget

CI workflow: `.github/workflows/deploy.yml`.

---

## 9. Historical docs

Earlier root docs (`ENV_SETUP.md`, `PROJECT_STRUCTURE.md`, `REFACTORING_GUIDE.md`) described the Firebase-era layout and were removed during the Supabase migration WIP. Their intent is superseded by this file and `design.md`.
