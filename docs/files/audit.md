# Monsterpedia audit

Audit date: 7 November 2026. The app was exercised in a browser against the Firebase Auth and Firestore emulators, with demo accounts and demo entries. No product code was changed. Screenshots live in [docs/screenshots](../screenshots).

## How it was run

The repository does not contain a Firebase project. `app.config.ts` imports `src/environments/environment.development.ts`, which is gitignored and was not in the tree. A local, uncommitted config pointed the app at emulators on `127.0.0.1:9099` (Auth) and `127.0.0.1:8080` (Firestore). Rules inside the emulator allowed all reads and writes so the screens could load. That open ruleset was only for the audit. The repository still has no rules file.

Accounts used:

| Account | Email verified | What the client calls the role |
| --- | --- | --- |
| signed out |  | none |
| `visitor@monsterpedia.test` | no | `visitor` |
| `scholar@monsterpedia.test` | yes | `user` |
| `intruder@monsterpedia.test` | yes | `user` |
| a new registration | no | `visitor` |

An admin account was not created because the client never reads a role from Firebase. Forcing one would have required a code change, and the screens would have been identical: the profile does not show a role, and `PermissionsService` is unused.

Viewports were 1440×900 and 390×844. Lighthouse 12 (mobile) was run against a production build served locally. The catalog at that moment included one incomplete document, which is called out where it affected the score.

## Severity

| Level | Meaning |
| --- | --- |
| Critical | Data can be damaged, or a primary task cannot be done, or there is no server-side protection |
| High | An important flow is broken, misleading, or not safe to ship |
| Medium | A real defect with a workaround, or a WCAG / SEO failure on a main screen |
| Low | Dead code, copy and token drift, missing polish |

## Ranked findings

### Critical

#### C1. Firestore is unprotected, and the entry document stores the author's email

There is no `firestore.rules`, no `storage.rules`, and no `firebase.json`. The README says client checks are not enough and then shows a sample ruleset that was never added to the repo.

The client writes the whole `IUser` into `author`, including `email`, `role`, and `emailVerified`. A public read rule, which the README sample uses (`allow read: if true`), would publish those addresses. The sample's admin check reads `users/{uid}.role`, and the app never writes that collection, so the sample would also fail closed for every admin action if someone pasted it in.

**Evidence.** `src/app/core/services/entry.service.ts` writes the object it is given. The document saved for Lamia after a second user edited it contains `author.email` of `intruder@monsterpedia.test`. See C5.

#### C2. The admin role cannot exist, and the permission matrix is not enforced

`mapFirebaseUser` sets `visitor` when `emailVerified` is false and `user` when it is true. `UserRole.ADMIN` is never assigned. `PermissionsService` is not injected by any component. The dashboard always renders Edit and Delete. The editor never compares `author.id` with the signed-in user.

The README table says visitors can read, users can edit their own articles, and only admins can delete, approve, or edit other people's work. Approval and user management have no UI at all.

**Evidence.** `src/app/core/services/auth.service.ts` (role assignment), `src/app/pages/dashboard/dashboard.component.html` (both action buttons), and a grep for `PermissionsService` that hits only its own file. The profile screen has no role field: [user-profile-desktop.png](../screenshots/user-profile-desktop.png).

#### C3. There is no page for reading an entry

Signed-out discovery ends at the login form. Signed-in discovery ends at the editor.

- Article of the day, "Leer más", navigates to `/entry/:id`. Logged out, that route's guard sends the browser to `/auth`. [logged-out-read-more-redirects-to-auth.png](../screenshots/logged-out-read-more-redirects-to-auth.png)
- The index is itself behind `authGuard`. Logged out, `/#/wiki-articles` and the header Índice land on the login form. [logged-out-wiki-redirects-to-auth.png](../screenshots/logged-out-wiki-redirects-to-auth.png)
- A direct `/#/entry/lamia` does the same. [logged-out-entry-deep-link.png](../screenshots/logged-out-entry-deep-link.png)
- Signed in, "see more" opened `/#/entry/aracne`, which is the edit form. [see-more-opens-editor.png](../screenshots/see-more-opens-editor.png)

The only public prose is whichever markdown string the home column randomly selected. It cannot be linked.

#### C4. Reloading a protected URL drops the page and opens the dashboard

`authGuard` takes the first value of a subject that starts as `null`. On reload that value is "logged out", so the guard redirects to `/auth` before Firebase restores the session. `AuthComponent` then sees the restored user and navigates to `/dashboard`. There is no return URL.

Measured after a warm login, reloading these URLs:

| Before reload | After reload |
| --- | --- |
| `/#/profile` | `/#/dashboard` |
| `/#/wiki-articles` | `/#/dashboard` |
| `/#/entry/lamia` | `/#/dashboard` |
| `/#/dashboard` | `/#/dashboard` |

The dashboard survives only because it is the redirect target. An editor with unsaved work is discarded, and a shared edit link does not reopen. [reload-protected-route-lands-on-dashboard.png](../screenshots/reload-protected-route-lands-on-dashboard.png) is the dashboard that appeared after reloading the Lamia editor.

#### C5. Any verified user can rewrite any entry, and the save destroys author and date

The editor's submit handler sets `author` to the current user and `date` to `new Date()` for both create and update. `updateDoc` writes that whole object. There is no revision subcollection, no `updatedAt`, and no version check, so two editors silently overwrite each other.

`intruder@monsterpedia.test` opened `/#/entry/lamia`, which was authored by `scholar@monsterpedia.test`, and saved. Firestore afterwards:

- `author.id` is the intruder's uid, `author.email` is `intruder@monsterpedia.test`, `author.role` is `user`
- `description` is "Editada por alguien que no es la autora."
- `date` changed from `2024-06-01` to `2026-11-07T19:03:13Z`

The original author and the original date are gone. [other-user-edits-entry.png](../screenshots/other-user-edits-entry.png). The wiki card then showed the new sentence: [wiki-search-malformed-entry.png](../screenshots/wiki-search-malformed-entry.png).

The same dashboard shows a delete button to every verified user. Nothing calls `canDeleteArticle`.

### High

#### H1. A clean checkout does not build

`ng build` on a fresh tree:

```text
Could not resolve "../environments/environment.development"
src/app/app.config.ts:7:28
```

`environment.template.ts` and `.env.template` are not read by Angular. `ENV_SETUP.md` tells the developer to copy values into `environment.development.ts` by hand, and also says a file named `walkthrough.md` has the security examples. That file is not in the repo. With a local env file present, the production build succeeds and prints budget warnings (finding M8).

#### H2. "Upload images" stores the file name

`onFileSelected` pushes `file.name` into `selectedImages`. The template does not show those names, and nothing talks to Cloud Storage. Creating an entry with `dot.png` selected stored `images: ["dot.png"]`. The next page requested `http://127.0.0.1:4200/dot.png` and got a 404. The wiki card is a brown empty frame with the name as alt text. [editor-file-selected-no-preview.png](../screenshots/editor-file-selected-no-preview.png), [wiki-desktop.png](../screenshots/wiki-desktop.png).

Choosing a new file also replaces the array, so a later edit drops any real URL that was already saved.

#### H3. The home page is not an article of the day, and bad data crashes it

On one desktop load the feature card was Harpía, the pinned profile was also labeled Harpía but illustrated with `lamia.jpg`, and the article column was Aracne. Threat on the profile read `8 / 5` while the editor and the dashboard use a 0–10 scale. [home-desktop.png](../screenshots/home-desktop.png).

Each block subscribes on its own and picks `Math.random()` inside the snapshot callback, so any write reshuffles the page. `getRandomEntry()` exists and is unused.

With an empty collection the feature card and the list say "No hay artículos disponibles". The profile and the article stay on "Cargando..." because they treat a missing slot as still loading. [home-empty-desktop.png](../screenshots/home-empty-desktop.png).

A document without `commonNames` makes the bulletin call `.join`. Lighthouse's production run logged `TypeError: Cannot read properties of undefined (reading 'join')` and left the article column on the loading sentence.

#### H4. The signed-in layout does not fit a phone

The sidebar stays fixed at 180px on a 390px viewport and the page is pushed by the same amount. The logout button overlaps the bestiary list. The hero title breaks into a few words per line. The wiki grid asks for 320px columns inside the remaining ~210px. [visitor-home-mobile.png](../screenshots/visitor-home-mobile.png), [wiki-mobile-logged-in.png](../screenshots/wiki-mobile-logged-in.png), [user-dashboard-mobile.png](../screenshots/user-dashboard-mobile.png).

Logged-out mobile is a normal single column. [home-mobile.png](../screenshots/home-mobile.png), [home-mobile-menu.png](../screenshots/home-mobile-menu.png).

#### H5. The stack is out of security support, and nothing tests it

Installed `@angular/*` is 19.2.14. Angular 19's security support ended on 19 May 2026. The final 19.2.25 patch is still inside the vulnerable range `<=19.2.25` reported by `npm audit` for the XSS sanitizer advisories (GHSA-jrmj-c5cx-3cw6, GHSA-v4hv-rgfq-gp49, GHSA-g93w-mfhg-p222, and others). Some of those advisories are SSR-only, and this app does not use SSR. The sanitizer bypasses matter because home-page markdown is passed through Angular's HTML sanitizer, and any verified user can write that markdown (C5).

`npm audit` reported 6 critical, 50 high, 28 moderate, and 5 low issues across the tree. Many critical items are transitive dev tooling (`tar`, `piscina`, `protobufjs`). The high findings on `@angular/core`, `@angular/common`, `@angular/compiler`, and `@angular/router` are direct. PrimeNG 19.1.3 is flagged only because it depends on those Angular packages.

Current releases on 7 November 2026: Angular 22.2.5, `@angular/fire` 21.0.0 (peer `@angular/core` `^21.2.0`), Firebase JS 13.2.0, PrimeNG 22.1.4 (peer Angular `^22.1.0`). AngularFire has not published a 22.x line, so the supported landing spot is Angular 21 plus AngularFire 21, then Angular 22 when AngularFire catches up. Angular 20's security support ends 28 November 2026, so stopping there is not a plan.

There are zero `*.spec.ts` files. Schematics are generated with `skipTests: true`. There is no CI workflow. ESLint is listed in the README and is not installed.

#### H6. One incomplete document breaks search and the dashboard

Search does `entry.description.toLowerCase()` and `entry.tags.some` with no guards. A query that does not match the broken document's name throws, and the previous list stays on screen. The box contained `zzz-no-match` while every card, including the broken "Rota" card, was still visible. [wiki-search-malformed-entry.png](../screenshots/wiki-search-malformed-entry.png). A query that does match ("harpia") filters correctly when every document is well formed. [wiki-search-hit.png](../screenshots/wiki-search-hit.png), [wiki-search-empty.png](../screenshots/wiki-search-empty.png).

The dashboard renders `entry.author.displayName`. The broken document has no `author`. The console logged `TypeError: Cannot read properties of undefined (reading 'displayName')` from the dashboard row template, and the table gained blank rows.

Opening `/#/entry/missing-monster` throws `Cannot read properties of undefined (reading 'name')` because `docData` emits `undefined` for a missing doc and the editor still reads `entry.name`. The `alert` in the error callback never runs. [editor-missing-entry.png](../screenshots/editor-missing-entry.png).

#### H7. Visitors are blocked without an explanation, and the index is not public

A verified user reaches the dashboard. An unverified user who signs in is taken to `/home`. The sidebar still offers Dashboard and Nueva Entrada. Both routes return to `/home` and say nothing. [visitor-home-desktop.png](../screenshots/visitor-home-desktop.png), [visitor-dashboard-redirects-home.png](../screenshots/visitor-dashboard-redirects-home.png), [visitor-profile-desktop.png](../screenshots/visitor-profile-desktop.png).

The profile does show the verification state and a button to resend the email, which is the one clear visitor affordance. The wiki is reachable once signed in, including for a visitor. [visitor-wiki-desktop.png](../screenshots/visitor-wiki-desktop.png). That contradicts the README, which says a visitor can view articles without an account, and it still does not contradict C3: the cards open the editor, which a visitor cannot use.

Unknown paths such as `/#/this-route-does-not-exist` redirect to home. There is no 404. [unknown-route-becomes-home.png](../screenshots/unknown-route-becomes-home.png).

### Medium

#### M1. Auth feedback throws away the message the service already wrote

Wrong password displayed "Ocurrió un error inesperado. Inténtalo de nuevo más tarde." The service's map contains "Credenciales inválidas" for `auth/invalid-credential`, and the component never reads `err.message`. [auth-login-error.png](../screenshots/auth-login-error.png).

Registration of `new…@monsterpedia.test` left the auth card immediately. The next screen was the home page, the sidebar showed the email address rather than the display name just submitted, and the success sentence was not on the page. `toggleMode()` clears feedback, and the auth page redirects any session to the dashboard, which then rejects a visitor. [auth-register-lands-on-home.png](../screenshots/auth-register-lands-on-home.png).

#### M2. Reset password is a different product, and it confirms whether an email exists

The screen does not use the paper card. Heading, label, and buttons inherit body ink `#4a3b31` on page brown `#8d6e63` (about 2.3:1). Axe reported three serious contrast failures. Classes on the heading and buttons are undefined. [reset-password-desktop.png](../screenshots/reset-password-desktop.png), [reset-password-mobile.png](../screenshots/reset-password-mobile.png).

Submitting an unknown address showed "No se encontró un usuario con este email". [reset-password-error.png](../screenshots/reset-password-error.png). The template bug is in `reset-password.component.html`: `@if (error()) {}` is empty and the red paragraph is unconditional.

#### M3. WCAG failures on the primary screens

Axe (WCAG 2.x A/AA) and Lighthouse:

- Color contrast, serious, on the wiki title and subtitle, the logout label, the reset-password text, and the home loading line. Ratios are in [design.md](design.md).
- The menu button has no accessible name. It is also `focus:outline-none`. Lighthouse `button-name` failed on `header button`.
- Header items are `<a>` elements without `href`. They are not in tab order and Lighthouse marked them not crawlable. The logo is the same.
- Article cards, the feature card, and see-more rows are clickable `<div>`s. They have no keyboard handler and no link.
- The wiki search field has a placeholder and no `<label>`.
- The password reveal control is a `<div (click)>`, not a button, and has no name.
- `lang="en"` while the UI is Spanish.
- Dashboard delete uses `confirm()`, and the editor uses `alert()`. Both are outside the page's focus order and styling.

The login form itself, which uses real labels, had no axe violations. [auth-login-desktop.png](../screenshots/auth-login-desktop.png).

#### M4. SEO and sharing

Lighthouse 12, mobile, production build of `/#/home` on this machine:

| Category | Score |
| --- | --- |
| Performance | 59 |
| Accessibility | 83 |
| Best practices | 96 |
| SEO | 82 |

| Audit | Result |
| --- | --- |
| First Contentful Paint | 5.5 s |
| Largest Contentful Paint | 5.6 s |
| Total Blocking Time | 10 ms |
| Cumulative layout shift | 0.157 |
| Meta description | missing |
| Crawlable anchors | failed |
| Color contrast | failed |
| Button name | failed |
| Errors in console | failed (`join` of undefined, H3) |
| Document title | present, but the route title is `Home` |

These timings are from a local VM talking to emulators, with a broken document in the catalog, so they are a ceiling on how slow the shell got, not field data. The structural failures (hash URLs, anchors without `href`, no meta description, `lang`, route title `Home`) do not depend on that.

Hash routing plus a client-only render means a crawler that does not run JavaScript indexes one document for every entry. Nothing emits per-entry titles or descriptions.

#### M5. The editor does not tell you what is wrong

Required fields are `name`, `description`, and `content`. Submitting an empty form marks the controls `ng-invalid` and stays on the page. There is no error text under any field. [editor-invalid-submit.png](../screenshots/editor-invalid-submit.png). Species, classification, and tags are optional, so a card can be stored with blanks and then trip H6.

There is no `canDeactivate` guard. Leaving the form drops what was typed. Success and failure are `alert()` dialogs. There is no markdown preview even though the public column renders markdown.

`currentUser` is captured when the component is constructed. A save that happens before `onAuthStateChanged` writes `author: null`. The warm-session create in this audit did store Archivista, so this is a race in the code rather than a failure observed on that particular click.

#### M6. Dashboard actions look unfinished, and the mobile table loses its labels

`.dashboard-btn-primary` is not defined. The button also has `btn-primary`, which sets colors and not padding. Computed style: padding `0`, radius `0`, brown background, white text. [dashboard-empty-desktop.png](../screenshots/dashboard-empty-desktop.png), [user-dashboard-desktop.png](../screenshots/user-dashboard-desktop.png).

Below 768px the table cells become blocks and `td::before { content: attr(data-label) }`. No cell sets `data-label`, so the mobile cards show values without the words Nombre, Especie, or Fecha. [user-dashboard-mobile.png](../screenshots/user-dashboard-mobile.png).

#### M7. The catalog is downloaded in full, repeatedly

`EntryService` subscribes in the constructor and never unsubscribes. Home adds four more listeners (feature, bulletin, article, see-more). Wiki and dashboard add another. There is no pagination, no `limit`, and no query. Search cannot be deep-linked. The feature card and the see-more order change whenever any document changes.

AngularFire logged `Firebase API called outside injection context` for `collectionData` and `docData`, because those calls happen from `ngOnInit` and from the service constructor's subscription callback rather than an injection context.

#### M8. The production bundle is over its own warning budget

`ng build` with a local env file present:

| | Raw | Transfer |
| --- | --- | --- |
| Initial total | 777.76 kB | 210.28 kB |

The warning budget is 500 kB. The error budget is 1 MB, so the build exits 0. Component stylesheets over the 4 kB warning: see-more (4.44 kB), wiki (4.14 kB), entry (4.91 kB), profile (5.55 kB), dashboard (5.03 kB), auth (4.17 kB). None hit the 8 kB error budget. The duplication described in [design.md](design.md) is the reason those files are large: each screen restates the paper sheet.

CLS of 0.157 matches the home page painting empty regions and then dropping cards in when the collection arrives.

### Low

#### L1. The README and the tokens describe a system the code only partly has

- `clasification` is misspelled in the interface, the form control, and every document.
- Route titles mix English and Spanish. The visible UI is Spanish.
- `auth.interceptor.ts` and `getRandomEntry()` are dead.
- Stat color tokens for strength, intellect, magic, and charm are unused. Agility green is borrowed for a threat chip.
- `::ng-deep` styles the markdown column.
- PrimeNG and `@primeng/themes` are dependencies. The only PrimeNG widgets are `InputGroup` on the password field. `providePrimeNG` is never called. The field still rendered because `.auth-input` styles it.
- Tags under the home article are `<a href="#">` with `preventDefault`. They do not filter.
- Header "Sugerir" always goes to `/auth`, including for someone who can already open the editor.
- `.btn` and `.btn-primary` were split, so the dashboard button lost its padding (M6).

#### L2. Empty, error, and not-found states are inconsistent

Article of the day and the wiki have a real empty state. The bulletin and the article column do not (H3). Missing ids throw (H6). Unknown routes become the home page (H7). The wiki empty state is fine when the collection is actually empty. [wiki-empty-desktop.png](../screenshots/wiki-empty-desktop.png), [dashboard-empty-desktop.png](../screenshots/dashboard-empty-desktop.png).

## A regular reader

The first screen has a point of view. "Un Bestiario de Criaturas Singulares" on a brown field is more specific than a generic wiki hero, and the paper card with a plate is the right object. It falls apart as soon as you try to read.

The feature story, the plate, and the essay are three different creatures. The plate's picture is Lamia even when the caption is Harpía, and the danger is "8 / 5", which is not a scale. "Leer más" and "Ver Todos los Artículos" do not open an essay. They ask you to sign in. After you do, the same controls open a form titled "Editar Entrada de Monstruo". Índice in the header does the same sign-in detour. There is no way to copy a link to Harpía's essay, because that page does not exist.

Search works for a complete catalog and a single word ("harpia" found Harpía). It does not survive a hole in the data, and the box gives no sign that the filter failed. Nothing explains why a brand-new account can see the index and cannot open Dashboard, or why Sugerir sends you to a login form you have already passed.

On a phone, before sign-in, the page is readable. After sign-in, a second navigation column covers half the screen and the logout button sits on top of the list.

## QA notes by area

**Routing.** Hash URLs. No 404. Guards disagree with the README. Deep links to `/entry/:id` are edit links. Reload loses them (C4).

**Auth edges.** Visitor, user, and the impossible admin are covered above. Email verification is the only gate, and it is enforced only in the client. The verification link uses Firebase's default handler. The app never calls `reloadUser` when you come back, so the role stays `visitor` until the next full auth reload. Registration and bad passwords mishandle messages (M1). Reset password leaks account existence on the emulator (M2).

**Rules and validation.** No rules in the repo (C1). The form's `Validators.min(0)` / `max(10)` are not repeated on the server. Threat, species, and tags can be empty. Images are unchecked strings. `author` is client-supplied.

**Editor.** No field errors (M5), no preview, no dirty check, `alert` on success, filename upload (H2), author and date replaced (C5), missing id throws (H6).

**History and conflicts.** Not implemented. Last write wins. The previous author is not kept.

**Search.** Client filter over the full collection. No query string. Crashes on null fields (H6). No diacritic folding beyond `toLowerCase`.

**Accessibility, performance, console, tests, dependencies, deploy.** M3, M4, M7, M8, H1, H5. Console during the pass: AngularFire injection-context warnings, a 400 from the auth emulator on the bad password and the unknown reset email, a 404 for `dot.png`, the `displayName` crash, the `name` crash, and the `join` crash.

## Design taste

The brief is a monster encyclopedia that should feel like a researcher's folio. The brown ink, the cream sheet, and the pinned plate are a real idea, and they are more specific than a purple gradient and a three-column feature grid. They are not carried through.

What reads as generated, with the screen next to it:

- The article-of-the-day block is a 135 degree gradient, a pulsing PrimeIcons star, and a blur overlay. It is a banner component, not a plate. [home-desktop.png](../screenshots/home-desktop.png).
- The same four pin circles are pasted into auth, dashboard, editor, profile, and the sidebar. They are blue-grey (`#78909c`), which is not a color a copperplate pin would be, and they sit on every sheet whether or not anything is pinned. [auth-login-desktop.png](../screenshots/auth-login-desktop.png), [user-dashboard-desktop.png](../screenshots/user-dashboard-desktop.png).
- Logout is Material red. Threat chips are Material green, amber, and red. Icons are the PrimeIcons defaults. The type the tokens name is not loaded, and the logo asks for a font family called `var(--font-family-title)`.
- The hero is a centered headline and a one-sentence subtitle, the default marketing opening, on a field of the accent brown. The parchment token exists and is unused as a page color.
- Reset password was left on the previous class names, so one of the three auth screens has no design at all. [reset-password-desktop.png](../screenshots/reset-password-desktop.png).
- One photograph, `lamia.jpg`, is used as the portrait of whichever creature the bulletin rolled.

It looks like a careful palette was chosen and then a component library finished the job. The folio never gets to be a folio, because the home page will not stay on one creature.

A hand-made direction is in the plan: one paper color for the page, one specimen per spread, the photograph only on Lamia's plate, a catalog number and an inked threat mark instead of a badge, and navigation that behaves like an index rather than an admin shell beside a marketing bar.

## Screenshot index

| File | What it shows |
| --- | --- |
| [home-desktop-fold.png](../screenshots/home-desktop-fold.png) | First viewport, signed out |
| [home-desktop.png](../screenshots/home-desktop.png) | Full home: three creatures, Lamia photo on Harpía, threat 8/5 |
| [home-empty-desktop.png](../screenshots/home-empty-desktop.png) | Empty catalog, stuck "Cargando" |
| [home-empty-mobile.png](../screenshots/home-empty-mobile.png) | Empty home, phone |
| [home-mobile.png](../screenshots/home-mobile.png) | Signed-out home, phone |
| [home-mobile-menu.png](../screenshots/home-mobile-menu.png) | Header menu open |
| [home-mobile-menu-empty.png](../screenshots/home-mobile-menu-empty.png) | Menu over the empty home |
| [auth-login-desktop.png](../screenshots/auth-login-desktop.png) | Login card |
| [auth-login-mobile.png](../screenshots/auth-login-mobile.png) | Login, phone |
| [auth-login-error.png](../screenshots/auth-login-error.png) | Generic error on a bad password |
| [auth-register-desktop.png](../screenshots/auth-register-desktop.png) | Register mode |
| [auth-register-lands-on-home.png](../screenshots/auth-register-lands-on-home.png) | After register: home, no success message |
| [reset-password-desktop.png](../screenshots/reset-password-desktop.png) | Unstyled reset form |
| [reset-password-mobile.png](../screenshots/reset-password-mobile.png) | Reset, phone |
| [reset-password-error.png](../screenshots/reset-password-error.png) | "No se encontró un usuario" |
| [logged-out-wiki-redirects-to-auth.png](../screenshots/logged-out-wiki-redirects-to-auth.png) | Index deep link |
| [logged-out-entry-deep-link.png](../screenshots/logged-out-entry-deep-link.png) | Entry deep link |
| [logged-out-read-more-redirects-to-auth.png](../screenshots/logged-out-read-more-redirects-to-auth.png) | Leer más |
| [unknown-route-becomes-home.png](../screenshots/unknown-route-becomes-home.png) | Unknown path |
| [visitor-home-desktop.png](../screenshots/visitor-home-desktop.png) | Unverified account, sidebar |
| [visitor-home-mobile.png](../screenshots/visitor-home-mobile.png) | Same, phone, sidebar overlaps |
| [visitor-profile-desktop.png](../screenshots/visitor-profile-desktop.png) | Unverified profile |
| [visitor-wiki-desktop.png](../screenshots/visitor-wiki-desktop.png) | Visitor can open the index |
| [visitor-wiki-mobile.png](../screenshots/visitor-wiki-mobile.png) | Visitor index, phone |
| [visitor-dashboard-redirects-home.png](../screenshots/visitor-dashboard-redirects-home.png) | Dashboard blocked |
| [visitor-editor-redirects-home.png](../screenshots/visitor-editor-redirects-home.png) | Editor blocked |
| [user-dashboard-desktop.png](../screenshots/user-dashboard-desktop.png) | Verified dashboard, delete on every row |
| [user-dashboard-mobile.png](../screenshots/user-dashboard-mobile.png) | Dashboard cards, no column labels |
| [dashboard-empty-desktop.png](../screenshots/dashboard-empty-desktop.png) | Empty dashboard |
| [dashboard-after-create.png](../screenshots/dashboard-after-create.png) | After creating Quimera |
| [wiki-empty-desktop.png](../screenshots/wiki-empty-desktop.png) | Empty index |
| [wiki-desktop.png](../screenshots/wiki-desktop.png) | Index with a broken image |
| [wiki-mobile-logged-in.png](../screenshots/wiki-mobile-logged-in.png) | Index beside the sidebar |
| [wiki-search-hit.png](../screenshots/wiki-search-hit.png) | Search "harpia" |
| [wiki-search-empty.png](../screenshots/wiki-search-empty.png) | Search with no hit, healthy data |
| [wiki-search-malformed-entry.png](../screenshots/wiki-search-malformed-entry.png) | Search that did not filter; Rota has no fields |
| [editor-new-desktop.png](../screenshots/editor-new-desktop.png) | Blank editor |
| [editor-invalid-submit.png](../screenshots/editor-invalid-submit.png) | Submit with nothing filled in |
| [editor-file-selected-no-preview.png](../screenshots/editor-file-selected-no-preview.png) | File chosen, no preview |
| [editor-edit-entry.png](../screenshots/editor-edit-entry.png) | Editing Lamia |
| [editor-mobile.png](../screenshots/editor-mobile.png) | Editor, phone |
| [editor-missing-entry.png](../screenshots/editor-missing-entry.png) | Missing id, thrown in the console |
| [other-user-edits-entry.png](../screenshots/other-user-edits-entry.png) | Second user editing Lamia |
| [see-more-opens-editor.png](../screenshots/see-more-opens-editor.png) | A list click opened the editor |
| [user-profile-desktop.png](../screenshots/user-profile-desktop.png) | Verified profile, no role |
| [user-profile-mobile.png](../screenshots/user-profile-mobile.png) | Profile, phone |
| [reload-protected-route-lands-on-dashboard.png](../screenshots/reload-protected-route-lands-on-dashboard.png) | Where a reload of the editor ended |
