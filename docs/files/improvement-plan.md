# Improvement plan

This plan follows the audit in [audit.md](audit.md). It does not change behavior by itself. Do the phases in order. Later phases assume the public article page and the security rules exist.

Each step names the code to touch. "Quick" means a local change with no data migration. "Core" means the reading and writing model changes.

## Phase 1. Quick wins

Make the tree build, stop the crashes that a single bad document causes, and repair the screens that are already styled wrong.

1. **Make `ng build` work on a clean checkout.** Point `app.config.ts` at `environment.ts`. Commit `src/environments/environment.ts` with the placeholder values already in `environment.template.ts` (these are not secrets; the file is compiled into the client). Keep real projects in the gitignored `environment.development.ts`, and make the development `fileReplacements` entry actually match the import. Delete the unused `.env.template` path from the docs, or generate the environment file from it in one script. Update [environment-setup.md](environment-setup.md) so it no longer mentions `walkthrough.md`.

2. **Stop the null crashes.** In `WikiArticlesComponent.onSearch`, skip entries with missing `name`, `description`, `species`, or `tags`. In the dashboard row, use `entry.author?.displayName`. In the bulletin, use optional chaining on `commonNames` and `clasification`. In `EntryComponent.loadEntry`, if `docData` emits null, show the empty state instead of reading `entry.name`. Treat an empty collection as empty in `BulletinBoardComponent` and `MonsterArticleComponent`, the way `ArticleOfTheDayComponent` already does.

3. **One threat scale.** Print `threatLevel / 10` in the bulletin, or store the scale once next to `IEntry` and use it in the bulletin, the feature card, the wiki, and the dashboard.

4. **Auth messages.** In `AuthComponent`, display `err.message` from `AuthService` and stop switching on `err.code`. Do not call `clearFeedback()` inside the registration success path. Keep the success sentence on screen. Send a new account to `/profile` rather than `/dashboard`, so a visitor is not bounced through a forbidden route.

5. **Reset password.** Rebuild `reset-password.component.html` with the same card, labels, and buttons as `auth.component.html`. Put the error text back inside `@if (error())`. For `auth/user-not-found`, show the same sentence as a successful send, so the form does not reveal whether the address is registered.

6. **Fonts and the logo.** Add a stylesheet link (or a self-hosted `@font-face`) for Crimson Text and Sorts Mill Goudy, with `font-display: swap`. Remove `font-['var(--font-family-title)']` from the header, the bulletin, and the article title. Set `font-family: var(--font-family-title)` in CSS. Set `lang="es"` on `<html>` until real i18n exists.

7. **The create button and the menu button.** Add the `btn` class next to `btn-primary` on the dashboard, or fold padding into `.btn-primary`. Give the header menu button an `aria-label` and `aria-expanded`, and remove `focus:outline-none`. Give the wiki search input a `<label>`. Make the password toggle a `<button type="button">`.

8. **Header links.** Use `routerLink` on Inicio, Índice, and the wordmark so they have an `href`. Point Sugerir at `/entry` for a verified user and at `/auth` only when signed out.

9. **Document title and description.** Set a real default title in `index.html` (`Monsterpedia`) and add a meta description. Keep route titles in Spanish and prefixed with the site name.

## Phase 2. Core fixes

This is the work that makes it a wiki: a public essay, rules that match the matrix, and edits that do not destroy history.

### A public article

Add `pages/article` at `/article/:id`, with no auth guard. Render the markdown, the plate, the species list, and the tags. Link the feature card, the see-more rows, the wiki cards, and the bulletin here. Use `<a routerLink>` so the cards are links.

Keep `/entry/:id` as the editor, still behind the role guard. "Editar" on the article page is the only control that goes there, and only when `PermissionsService.canEditArticle` is true.

Unknown ids render a not-found state inside the layout. Unknown paths should use that state too, instead of `redirectTo: 'home'`.

### Session restore

Replace `take(1)` in `authGuard` with a stream that waits until Firebase has reported the first real auth state (an initial `null` before `onAuthStateChanged` does not count). Pass `returnUrl` in the navigation to `/auth`, and honor it after login. Remove the constructor subscription in `AuthComponent` that always sends every session to `/dashboard`, or limit it to a visit that had no `returnUrl`.

Add `take(1)` to `roleGuard` after the auth state is real, and show a sentence on `/profile` when a visitor is refused: email not verified yet.

### Roles that match the matrix

Store the role in a custom claim, not in a field the client can invent. On sign-in, read the claim. Keep `emailVerified` as the gate for `user`, and reserve `admin` for the claim. Write `PermissionsService` into the dashboard (hide Delete, hide Edit on other people's rows) and into the editor (refuse to load an id the user cannot edit).

Custom claims need the Admin SDK, which cannot ship in this Angular app. Add a small trusted function, or document a one-time Admin SDK script, and do not pretend the client can promote itself.

Reload the user when the profile screen opens so a freshly verified email becomes `user` without a manual refresh.

### Rules and a smaller document

Add `firestore.rules` and deploy them with the app. Minimum shape:

- `entries/{id}`: public read of published fields. Create and update only when `request.auth.token.email_verified == true`. The writer may change content fields. The writer may not change `authorId` or `createdAt` unless they are the admin claim. Delete only with the admin claim.
- Validate types: `name`, `description`, and `content` are non-empty strings under a size cap. `threatLevel` is an int from 0 to 10. Arrays are lists of strings under a length cap.
- Stop embedding `IUser` in the document. Store `authorId` and a display name. Do not store email on a world-readable document.
- `users/{uid}`: the owner can read their profile document. Clients cannot write `role`.

Add Storage rules only after upload exists. Until then, do not accept image strings that are not `http(s)` URLs you uploaded.

### Images

Add `provideStorage`. Upload selected files to `entries/{id}/{uuid}`, save the download URL, and show a preview and a remove control. Appending a file must not wipe URLs already stored.

### One creature on the home page, stable for the day

Pick the feature id with a hash of the UTC date modulo the published list, not `Math.random()` inside each subscriber. Pass that same entry into the bulletin and the markdown column. Use `entry.images[0]` on the plate, and fall back to a drawn placeholder, not `lamia.jpg`. Reserve `lamia.jpg` for the Lamia entry.

Subscribe once in `EntryService` (or a small store) and share the list. Call Firestore from an injection context, or use the AngularFire observable helpers the current version expects, so the injection-context warning goes away.

### Edits, history, conflicts

Split `createdAt` and `updatedAt`. Set `createdAt` and `authorId` only in `createEntry`. Never write them from the edit form.

On save, write the previous content to `entries/{id}/revisions/{revId}` with the editor's uid and a timestamp. Show the last few revisions on the article page.

Send `updatedAt` as a precondition (`updateDoc` only if the stored `updatedAt` still matches the value the form loaded). If it does not, show the other person's version and offer reload. Do not use `alert`.

Read the current user from `currentUser$` at submit time, not from a field initialized in the constructor.

Show validation messages under the required fields. Add a `canDeactivate` guard when the form is dirty.

### Search

Keep the filter client-side until the catalog needs a real index, but make it null-safe (phase 1) and write the query into `?q=` so a search has a URL. Normalize case. Do not throw if one document is missing a field; skip that field.

### Phone layout

Below 768px, do not reserve a column for the sidebar. Put those links in the existing header menu, or in a drawer that overlays and can close. The logged-out header menu is the pattern to extend, not a second fixed column.

Add `data-label` on the dashboard cells, or replace the table with a list that has visible labels at every width.

### Tests worth having before the upgrade

Add specs, and turn `skipTests` off for new files. The first set:

- `authGuard` allows a restored user and does not redirect on the initial `null`
- `roleGuard` allows `user` and `admin`, refuses `visitor`
- `PermissionsService` matches the matrix, including "user cannot edit someone else's id"
- entry form: empty submit shows errors, update payload keeps the original `authorId` and `createdAt`
- search: a document with no `tags` does not throw, and the others still filter

Run them in CI on pull requests, together with `ng build`.

### Dependencies

Do not jump from 19 to 22 in one step while `@angular/fire` 21 is the latest and it peers Angular 21.

1. Move to the latest Angular 21 and TypeScript that Angular 21 supports, and to `@angular/fire` 21 and Firebase JS 13.
2. Move PrimeNG to the 21 line that matches that Angular. `providePrimeNG` only if a PrimeNG widget remains. Otherwise drop PrimeNG and `@primeng/themes` and keep the one password button.
3. Re-run the guard and editor specs after each major.
4. When `@angular/fire` publishes a release that peers Angular 22, take that. Angular 20 is the wrong place to stop: its security support ends 28 November 2026.

Re-check `npm audit` after the move. The Angular XSS advisories on the 19 line are not fixed by staying on 19.2.25.

### Deploy

Add `firebase.json` with hosting, the Firestore rules, and (once uploads exist) Storage rules. Build with `ng build`, deploy the `dist/monsterpedia-app/browser` output to Firebase Hosting, and lock the API key to that domain. Hash routing can stay for the first deploy so existing links keep working. Removing it is a redirect project, not part of this phase.

## Phase 3. Design refresh

Do this after phase 2, so the new article page is the thing being designed, not the editor-as-reader.

The target is one research sheet, not a second theme on top of the current cards. Concrete moves:

1. **Page color.** Set `body` to `--color-bg-page` (`#f5e5c3`). Use `--color-brand-primary` for the header bar only. Recheck contrast: titles that were brown-on-brown become ink on parchment, which is already about 9:1 for `#5d4037` on `#fffdf5` and will be in the same range on `#f5e5c3`. Retire the blue-grey pins or recolor them to a dark metal derived from `--color-brand-primary`. Delete the Material red logout button. Use `.btn-secondary` for sign-out.

2. **One spread.** The home page below the header is a single sheet: catalog number, plate, species facts, and the markdown, all for the creature chosen in phase 2. Remove the gradient feature banner, the pulsing star, and the second random column. "More creatures" is a short index of names linking to `/article/:id`, not another set of cards with a different random order.

3. **Type, for real.** Sorts Mill Goudy for the creature name only. Crimson Text for body and UI. One size scale in the tokens (name, section, body, meta). No Tailwind arbitrary font families.

4. **Threat as a mark, not a chip.** Replace the green/amber/red badges with one inked treatment that works in the brown palette: a stamped word (Bajo, Medio, Alto, Crítico) or a row of marks out of ten. Map the four words from the same thresholds the feature card already uses, and use that map everywhere, including the dashboard.

5. **Plates.** If `images` is empty, draw a framed empty plate with the catalog number. Do not reuse `lamia.jpg`. Give that file to the Lamia entry only, as a real Storage URL.

6. **Navigation.** Signed out: header with wordmark, Índice, Entrar. Signed in: the same header plus the person's name, and Índice / Nueva ficha / Perfil in one menu. Delete the permanent sidebar, or keep it only at `lg` and above on the editor. The phone must not grow a second column.

7. **Delete the unused stat tokens** and the duplicated pin CSS. One paper class in `styles.css` (background, border, shadow). Auth, reset, dashboard, editor, and profile use it. That also pulls the component CSS back under the 4 kB warning.

8. **Copy.** Replace "Explora todos los artículos de la Monsterpedia" and "Descubre criaturas fascinantes" with lines that sound like catalog notes. Keep Spanish. The hero can stay one sentence, set in Goudy, left aligned on the parchment, not centered on a brown field.

Check the article page, the index, the editor, auth, and reset at 1440 and 390 after this pass. Run axe again on the home page and the article page. Contrast on parchment should clear AA. The logout control should no longer be the failure.

## Phase 4. Nice to have

Only after a public article, rules, and the folio refresh.

- Approval: a `status` field (`draft`, `published`) that rules enforce. The public query reads `published` only. This is the README's "approve articles" item, and it needs the admin claim from phase 2.
- A revision reader on the article page, not just the write path.
- Pagination or a search index once the collection is larger than a single snapshot.
- Server rendering or prerender of `/article/:id` and the index, then drop the hash router with redirects from `/#/article/:id`.
- Per-article `<title>` and meta description from the entry name and the first sentence.
- Bookmarks, stored under `users/{uid}/bookmarks`, with rules that only the owner can read them.
- Comments, if they are moderated. Do not add them as an open write on the article document.
- Spanish and a second language through Angular locales, not a second set of hard-coded strings.
- The dark parchment idea from the README, as a token override, after the light folio is the default.
- PDF export of one article. It should use the same sheet as the screen.

Skip, until a reader asks: activity feeds, social share buttons, and a second icon library.

## Suggested order of files

| Phase | Files |
| --- | --- |
| 1 | `app.config.ts`, `src/environments/environment.ts`, `angular.json`, bulletin and article components, `wiki-articles.component.ts`, `dashboard.component.ts`, `entry.component.ts`, `auth.component.ts`, `reset-password.component.*`, `index.html`, `header.component.*`, `styles.css` |
| 2 | new `pages/article`, `app.routes.ts`, both guards, `auth.service.ts`, `permissions.service.ts`, `entry.service.ts`, `entry.interface.ts`, `firestore.rules`, `firebase.json`, new specs under `src/app` |
| 3 | `styles.css`, `home.component.*`, `hero`, `article-of-the-day`, `bulletin-board`, `sidebar`, `layout`, shared paper styles |
| 4 | hosting rewrites, a render pipeline, bookmark and comment collections |
