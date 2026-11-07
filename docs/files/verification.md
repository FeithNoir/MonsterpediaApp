# Verification report — Monsterpedia improvement plan

Verified locally on **7 November 2026, America/Bogota (UTC−5)**. Machine-readable summary: [verification-results.json](verification-results.json).

**Story:** public reader opens a field folio → Firebase entries snapshot → normalized article/Markdown/plates; verified author signs in on a deep link → owns the editor → uploads bytes to Storage → commits content and prior revision atomically → returns to the public article. Administrators add cross-author editing/deletion, not self-granted roles.

## Acceptance results

| Check | Evidence |
| --- | --- |
| Clean checkout dependency contract | `npm ci` passed; public client environment files committed |
| Production build | `npm run build` passed; output `dist/monsterpedia-app/browser` |
| Angular/Vitest | `npm test`: **20 passed, 0 failed**, 6 files |
| Firestore/Storage rules | `npm run test:rules`: **24 passed, 0 failed** |
| Isolated Playwright + Auth/Firestore/Storage | `npm run test:e2e`: **12 passed, 0 failed**, desktop 1440×1050 and mobile 390×844 |
| Browser health | Every flow asserts **zero console errors and zero page errors**; 12 evidence arrays were empty |
| Accessibility | axe WCAG 2 A/AA + 2.1 AA on home and public article at both widths: **zero violations** |
| Mobile layout | Overflow assertion on every flow; signed-in menu/user/admin screenshots |
| Migration | `node --check scripts/migrate-author-privacy.mjs` passed; script itself **NOT RUN** |
| Source hygiene | `git diff --check` passed; `docs/refs` remains ignored; no new character art |

The acceptance sequence was a clean install followed by unit, build, rules and browser suites, not a report inferred from mocks alone. E2E creates fictional accounts and fixtures in local emulators and inspects resulting documents. Real upload URLs are served by the local Storage emulator. It verifies author/timestamp preservation, revision content, normal-user denial, admin deletion confirmation, restored protected routes, conflicts without data loss, registration verification, public-name reset, and password-reset success feedback.

### Flow boundaries

| Boundary | Result |
| --- | --- |
| Anonymous UI → catalog/article listener | Correct public folio, search URLs, missing/empty states |
| Login → returnUrl → role document | Original editor deep link restored, including page reload |
| Editor → Storage → URL/preview | Bytes uploaded, download URL saved, preview displayed |
| Editor → Firestore transaction | Parent version incremented; original author/createdAt retained |
| Transaction → public article | Updated title/body; previous snapshot appears in history |
| Concurrent remote update → editor save | Conflict shown; local draft kept; remote version can be reloaded |
| Role marker → actions → rules | Foreign edits refused for normal users, accepted for verified admin; only admin deletes |
| Account forms → SDK → feedback | Verified account refresh and success feedback persist; reset form clears without enumeration |

## Security attack matrix

| Attempt | Result / test evidence |
| --- | --- |
| Public collection query | Intentionally allowed for catalog entries; no draft/status workflow is claimed |
| Anonymous/unverified write | Denied for entry create/update/delete and Storage writes |
| Other-user edit | Denied even with optional editor marker |
| Own-author edit | Allowed only with valid schema, version and atomic previous revision |
| Administrator edit | Allowed without changing original author/creation timestamp |
| Author delete | Denied; verified admin delete allowed; unverified admin denied |
| Forge ownership on create/update | Denied |
| Change createdAt/displayName on edit | Denied |
| Required-field removal/type corruption | Denied on create and update |
| Oversized content/arrays | Denied; every list element is type/length checked |
| Maximal legal array payload | Create + author/admin atomic revision updates pass below expression budget |
| Threat negative/over-10/fraction/string | Denied |
| Timestamp spoof | Creation/update/revision timestamps must be server request time |
| Add embedded author/email/role/unknown key | Denied by strict schema; displayName with email-style `@` also denied |
| Grant/list/read someone else's admin marker | Denied; clients cannot write roles, including an existing admin |
| Read another private user document | Denied; no users collection access is granted |
| Falsify snapshot/editor or skip revision | Denied |
| Standalone/replayed/rewritten revision | Denied; previous snapshot must match parent and parent must advance |
| Orphan revision read/write | Denied when parent is absent |
| Revision query mismatch | Public ordered-last-five query succeeds for an existing parent |
| Status/counter/permission schema pollution | Denied; approval/counters are not implemented |
| Storage cross-user/root path | Denied |
| Storage SVG/HTML/arbitrary binary/over-5-MiB | Denied; verified owner image upload and public read succeed |
| Storage cross-user delete | Denied; verified owner delete succeeds |

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for public encyclopedia reads with verified, ownership-scoped writes, administrator-only deletion, immutable attribution, strict schema validation, and atomic revision history. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## Remaining warnings and limits

- Build still reports its **existing 500 kB initial-bundle warning**: 871.50 kB raw, about 230.29 kB estimated transfer, under the unchanged 1 MB error budget. The budget was not raised to hide the warning. Initial SDK loading needs a future performance pass.
- `npm audit` after the supported dependency upgrade and gRPC 1.14.7 override reports **0 high, 0 critical, 33 moderate** transitive findings, mainly administrative/CLI chains. Do not claim a zero-advisory dependency tree. A forced AngularFire/Firebase downgrade is not used as an audit fix.
- The emulator Admin SDK emits a Node-side metadata lookup warning in this box environment. It is **not a browser console error**, does not prevent the local suites, and is not hidden by test filtering.
- Lists are deliberately capped at 5 strings and images at 4 to keep maximal two-document transactions within Firestore's rule-expression budget; increasing these caps requires rerunning the maximal-payload test.
- MIME/size validation is not server-side image decoding, malware scanning or moderation. Unreferenced uploads and hidden orphan revision documents are not physically cleaned up by a browser client.
- All current entries are public. SSR/social crawler previews, moderation, pagination and other phase 4 items remain deferred as the plan states.
- Legacy production data was not read or migrated. Structured author-email removal and any legacy image/timestamp cleanup must be reviewed and applied separately before publication. Free-text privacy cannot be guaranteed by a field whitelist.
- Live Auth provider/domain/bucket provisioning, production deployment and post-deploy smoke checks remain operator prerequisites, not locally verified facts.
- GitHub CI has been prepared but cannot be called green until the branch is published and its workflow runs.

## Visual evidence

Original audit screenshots remain untouched. New screenshots use only fictional emulator data and contain no newly added character art.

| Before | After |
| --- | --- |
| `docs/screenshots/home-desktop.png` | `docs/screenshots/after-home-desktop.png` |
| `docs/screenshots/user-dashboard-mobile.png` | `docs/screenshots/after-dashboard-user-mobile.png` |

Additional evidence: `after-article-desktop.png`, `after-article-mobile.png`, `after-auth-*`, `after-reset-*`, `after-editor-user-*`, `after-dashboard-admin-*`, `after-index-empty-*`, and `after-menu-user-mobile.png`.

**No production deployment, rule publication, data migration or merge was performed.** Publishing the branch/PR is a separate externally visible action; this local acceptance report is not proof that such an action has occurred.
