# Improvement Plan — MonsterpediaApp

**Based on:** [`audit.md`](./audit.md), [`architecture.md`](./architecture.md), [`design.md`](./design.md)  
**Constraint:** This document is the plan only — do not treat it as already implemented.

Phases: **0 Quick wins** → **1 Core product fixes** → **2 Design refresh** → **3 Nice-to-haves**.

---

## Phase 0 — Quick wins (1–3 days)

Ship confidence and unblock empty/broken first impressions without redesigning the brand.

| # | Action | Outcome | Ties to |
|---|---|---|---|
| 0.1 | Fix Supabase browser access (CORS / API keys / project status / `apikey` headers). Confirm `entries` SELECT returns 200 from `localhost:4200`. | Home can show real data | U3 |
| 0.2 | Empty-state handling: if `entries.length === 0` or fetch errors, stop “Cargando…” and show a clear empty/error message with retry. | No infinite loaders | U2 |
| 0.3 | Load fonts (self-host or Google Fonts) for Crimson Text + Sorts Mill Goudy; add a working `.font-title` utility. | Brand type actually appears | Design |
| 0.4 | Set `index.html` `lang="es"` (or add i18n later), title to `Monsterpedia`, add a meta description. | Basic SEO/a11y hygiene | P1a, A3 |
| 0.5 | Point header “Sugerir” to a clear path: if logged out → auth with `returnUrl`; if USER+ → `/entry`. | Honest navigation | U5 |
| 0.6 | Standardize threat scale once (0–10) and fix bulletin `/5` label. | Consistent stats | Q6 |
| 0.7 | Remove unused `@angular/fire` / `firebase` from `package.json` once migration is confirmed. | Cleaner deps | S7 |
| 0.8 | Make `SupabaseService` import `environment` (not `.development`); verify `replace-env.js` + production build. | Deploy uses intended project | S4 |
| 0.9 | Map Supabase Auth errors in `AuthComponent` (drop Firebase `auth/*` codes). | Readable login failures | Q3 |
| 0.10 | Deduplicate fetching: widgets subscribe to `entries$` instead of each calling `getEntries()`. | Fewer network storms | Q10 |

**Exit criteria:** Home shows data or a correct empty state; fonts render; production env wiring verified; `npm run build` still green.

---

## Phase 1 — Core product fixes (1–2 weeks)

Make Monsterpedia behave like a wiki people can actually read and safely contribute to.

### 1A. Reading & routing

1. Add public route e.g. `/wiki/:id` (or `/monsters/:slug`) with a **reader** component (traits sidebar + markdown body + tags).  
2. Remove `authGuard` from `/wiki-articles` (index is public; RLS already allows anonymous SELECT).  
3. Retarget all “Leer más” / card clicks to the reader route; keep `/entry/:id` for editors only.  
4. Add slug or stable ID deep links; consider PathLocationStrategy for Pages (with existing `404.html` fallback) for better SEO than hash.  
5. Sync wiki search to `?q=` query param; preserve back/forward.

### 1B. Auth & security

1. Fix guards: wait for auth init (`authReady$` / `filter` + `take(1)`); preserve `returnUrl`.  
2. Align RLS with matrix: INSERT requires role `user` or `admin` (from JWT `app_metadata`); lock profile `role`/`is_active` from client updates (trigger or column grants).  
3. Hide dashboard delete unless `PermissionsService.canDeleteArticle`; hide edit unless `canEditArticle`.  
4. Fix password-reset redirect for hash or migrate off hash; add redirect URLs in Supabase dashboard.  
5. Implement or remove README claims for approve-article / manage-users.

### 1C. Editor & media

1. Integrate **Supabase Storage** for images; store public URLs in `images[]`.  
2. Add markdown preview (side-by-side) and basic client validation (length limits, threat 0–10, required fields).  
3. Stop overwriting canonical `date` on edit; use `updated_at` only.  
4. Add `CanDeactivate` dirty guard.  
5. Introduce `revisions` table (or Supabase history strategy): save snapshot on update; simple restore UI for authors/admins. Optional: `version` column + If-Match / `updated_at` check for conflicts.

### 1D. Quality gates

1. Enable tests for AuthService mapping, guards, EntryService mapping, wiki filter pure functions.  
2. Add Playwright smoke: home loads, wiki public, reader deep link, login wall for editor.  
3. Raise/rebalance budgets or trim PrimeNG imports to clear build warnings.  
4. Add axe check in e2e for home + reader + auth.

**Exit criteria:** Anonymous user can browse index → open article → share URL; contributor can upload a real image; RLS matches docs; smoke tests in CI.

---

## Phase 2 — Design refresh (1–2 weeks)

Make it feel hand-crafted without abandoning the bulletin-board thesis. Details in [`design.md`](./design.md).

| Step | Work |
|---|---|
| 2.1 | Switch body to parchment `--color-bg-page` + subtle paper noise texture; keep walnut for header/ink. |
| 2.2 | Redesign home first viewport: brand wordmark + one headline + one line + **one specimen plate** (Article of the Day) as the dominant visual — no CRM empty inbox. |
| 2.3 | Reader page as “dossier”: ruled frame, Latin species line, wax-seal threat mark, ink headings for markdown. |
| 2.4 | Replace brand-critical PrimeIcons with a small custom SVG set (threat, pin, habitat). Keep PrimeIcons only for dense admin chrome if needed. |
| 2.5 | Restyle reset-password + profile to match auth pinned-card language. |
| 2.6 | Article of the Day: deterministic daily selection (hash date → entry id) + ribbon dated label. |
| 2.7 | Add 2–3 motions: pin settle, paper slide for featured, fade-in for markdown. Respect `prefers-reduced-motion`. |
| 2.8 | Define spacing/type scale in tokens; remove unused `--color-stat-*` or actually use them on dossiers. |

**Exit criteria:** Side-by-side screenshots vs Phase 0 show a coherent bestiary, not a brown admin theme; Lighthouse a11y ≥ baseline improvement; design review checklist in PR template.

---

## Phase 3 — Nice-to-haves (backlog)

- Admin approval workflow + moderation queue  
- User management UI  
- Full-text search (Postgres `tsvector`) + tag facets  
- Favorites / bookmarks  
- Comments or field notes  
- i18n (es/en) with proper `lang` switching  
- PWA offline reading pack  
- Social OG images per monster (SSR or pre-render / edge OG)  
- Activity feed / notifications  
- Export entry to PDF / printable plate  
- Dark “candlelight” theme (optional; do not default-dark the brand)  
- Angular upgrade train (finish Supabase cleanup → Angular 20 LTS path)

---

## Suggested delivery order (summary)

```
Week 1:     Phase 0 + reader route skeleton + public wiki (1A.1–1A.3)
Week 2:     Storage images, RLS harden, guards, smoke tests (1B–1D)
Week 3–4:   Design refresh Phase 2 on home + reader + auth family
Ongoing:    Phase 3 backlog prioritized by traffic/contribution metrics
```

## Tracking

Open issues (or a project board) keyed to audit IDs (`U1`, `S4`, …). Each PR should reference the phase item and update screenshots under `docs/screenshots/` when UI changes.
