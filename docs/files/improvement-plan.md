# Improvement plan — implementation status

Baseline: [audit.md](audit.md), merged audit commit `62d97e5`. This branch implements phases 1–3 locally. **No production deploy, legacy migration or merge has been performed.** The interrupted cloud run left no implementation branch/PR or rules files in its Agent Store; work resumed from main on the box.

## Phase 1 — completed

- [x] Clean-checkout build: public SDK config committed, canonical environment import, matching replacements and emulator-only configuration. Obsolete `.env.template` removed.
- [x] Null-safe read boundary, search and templates; loading, error, empty catalog/search and not-found states.
- [x] One threat scale (0–10) and a single threshold map.
- [x] Auth errors translated consistently, registration feedback kept on profile, safe return URLs.
- [x] Reset card rebuilt; account existence is not revealed; reset form clears without clearing success feedback.
- [x] Real locally hosted Crimson Text/Sorts Mill Goudy, Spanish document language, no arbitrary utility font names.
- [x] Accessible menu/search/password controls, padded buttons and visible focus.
- [x] Real router links in the only navigation; writing routes redirect signed-out people to login.
- [x] Spanish route titles, default description and per-article client metadata.

## Phase 2 — completed in repository, production rollout pending

### Reading and sessions

- [x] Public `/article/:id` with sanitized Markdown, plates, facts, tags and revision reader; editing is a separate action.
- [x] Guard waits for Firebase restore/role lookup; returnUrl survives sign-in and page reload; verified-role guard completes after one real state.
- [x] Unverified accounts receive a profile explanation and can reload verification/token state.
- [x] Unknown paths/ids show not-found, not a misleading home redirect.

### Authorization and schema

- [x] Server-enforced author/admin editing, admin-only deletion, verified creation, immutable author/createdAt, bounded schema and timestamps.
- [x] PermissionsService drives all edit/delete UI; foreign author ids cannot be edited through the URL by a normal user.
- [x] **Updated decision:** trusted `admins/{uid}` and optional `editors/{uid}` markers replace the audit's proposed custom claims. No client can write/list role documents. Optional editors cannot edit other authors' work.
- [x] Public author attribution reduced to `authorId` and displayName; no embedded IUser/email. No public users collection.
- [x] Idempotent dry-run-first migration script prepared, including legacy revision snapshots; concurrent changes are refused. **NOT RUN.** Manual intervention is required for unmigratable timestamps/uids/images and free-text privacy review.
- [x] `firestore.rules`, `storage.rules`, indexes, firebase.json and `.firebaserc`; SPA rewrites and explicit project id `mosterpedia`.

### Content workflow

- [x] Real Storage byte upload, stored download URL, previews and non-destructive URL removal. Verified own-path image writes, allowlisted MIME, 5 MiB cap.
- [x] UTC creature-of-day hash from sorted ids; one shared list subscription and one shared specimen renderer. Date updates for overnight tabs.
- [x] Created/updated timestamps separated; transactional prior snapshots, editor id and version counter.
- [x] Version+timestamp conflict check; retain draft, show remote version, offer reload; no alert-based failures.
- [x] Read current account at submit time, field validation, dirty-route/beforeunload protection and reset controls.
- [x] Search URLs with `?q=`, null safety and case normalization.
- [x] Single mobile header menu; dashboard is a readable list without hidden table labels or reserved side column.

### Dependencies, tests and rollout

- [x] Angular 19 → **21.2** and AngularFire **21.0**; removed unnecessary PrimeNG/Tailwind/icon/Markdown wrapper dependencies.
- [x] Compatibility checked against npm peer/dependency metadata: AngularFire 21 peers Angular 21 and depends on Firebase **12.18+**, so Firebase JS **12.19** is kept. Angular 22/Firebase 13 are deferred until a supported combination is available, rather than forced.
- [x] Unit tests for guards, permissions, deterministic selection/search, malformed data, Markdown safety, editor validation/identity payload/conflicts and reset privacy.
- [x] Rules emulator attack matrix, including maximal legal arrays to avoid rule evaluation-budget regressions. Lists are bounded to **5×80 characters**, images to **4**, consistently in editor/rules/migration.
- [x] Desktop/mobile Playwright against Auth/Firestore/Storage emulators: signed out, normal, unverified, admin; real upload/create/edit/revision/delete; restore, conflicts, registration/profile/reset.
- [x] GitHub Actions CI for build, unit, rule and browser tests; no deploy job.
- [x] README exact deploy commands and trusted-console `admins/{HugoUid}` bootstrap.
- [ ] **Operator rollout, intentionally not performed:** backup, review/apply privacy migration, verify providers/bucket, create admin marker, merge and deploy after approval.

## Phase 3 — completed

- [x] Warm parchment page, restrained ink masthead, readable single paper system.
- [x] One specimen per spread; plate and essay stay synchronized; no gradient banner, pulsing star or second random column.
- [x] Local title/body fonts and one size scale.
- [x] Inked threat stamp and text/marks out of ten.
- [x] Framed empty catalogue plate, no unrelated Lamia fallback and no new character art committed.
- [x] Single responsive navigation for both session states; mobile never reserves sidebar width.
- [x] Duplicate style sheets, pins and unused design dependencies removed.
- [x] Spanish field-notebook copy, explicit empty/error/permission states.
- [x] Current home/article/index/editor/auth/reset and user/admin screenshots at desktop/mobile widths; axe WCAG A/AA on home/article.

## Phase 4 — partial, remaining work explicitly deferred

Already included because the core data flow made them inexpensive:

- [x] Last-five revision reader on the public article.
- [x] Per-article client-side title/description.
- [x] Clean SPA deep links and compatibility conversion for old hash bookmarks.

Deferred:

- [ ] Draft/public approval workflow and moderation; current entries are all public.
- [ ] Pagination or remote search once a single snapshot is insufficient.
- [ ] SSR/prerender and crawler/social-preview guarantees (not equivalent to the current SPA rewrite).
- [ ] Bookmarks, moderated comments, i18n, dark parchment and article PDF export.
- [ ] Trusted-server orphan Storage/subcollection cleanup and content/magic-byte scanning.
- [ ] Additional initial-bundle reduction: the existing 500 kB warning remains visible rather than raising its budget.
- [ ] Upstream moderate dependency advisories; the gRPC override removes high/critical findings without a forced incompatible downgrade.

See [verification.md](verification.md) for exact results, limitations and the attack matrix. Do not infer live behavior from the checked-off repository work until rollout is explicitly approved and completed.
