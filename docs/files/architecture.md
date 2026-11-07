# Architecture

This document describes Monsterpedia as the code actually works in November 2026. It is not the intended design from the README. Where the two disagree, this file follows `src/`.

## Shape of the app

Monsterpedia is a single-page Angular 19 application. There is no custom backend. Firebase Authentication and Cloud Firestore are called directly from the browser. Firebase Storage is named in the README and is not wired up: `app.config.ts` never calls `provideStorage`, and the editor stores file names rather than uploading bytes.

The root component renders one `router-outlet`. Almost every screen sits inside `LayoutComponent`, which always shows the header and, once `AuthService` has a user, a fixed sidebar.

```text
src/app
├── app.config.ts          Firebase, hash router, HTTP interceptor
├── app.routes.ts
├── auth/                  login/register, password reset
├── core/
│   ├── enums/user-role.enum.ts
│   ├── guards/            authGuard, roleGuard
│   ├── interceptors/      auth.interceptor.ts (not used by Firestore)
│   ├── interfaces/        IUser, IEntry
│   └── services/          AuthService, EntryService, PermissionsService
├── pages/                 home, dashboard, entry, profile, wiki-articles, layout
└── shared/                header, hero, sidebar, article of the day, see-more
```

`HomeComponent` is imported eagerly by the router. The other pages are lazy `loadComponent` calls. There are no feature modules and no NgRx store. State is a set of root services plus component signals.

## Bootstrapping and configuration

`src/app/app.config.ts` always imports `src/environments/environment.development.ts`:

```ts
import { environment } from '../environments/environment.development';
```

That file is gitignored, and so is `environment.ts`. The only committed Firebase config is `environment.template.ts`, which nothing imports. `angular.json` has a development `fileReplacements` entry that swaps `environment.ts` for `environment.development.ts`, but the source never imports `environment.ts`, so the replacement does nothing. A clean checkout fails `ng build` and `ng serve` with `Could not resolve "../environments/environment.development"`.

Routing uses `HashLocationStrategy`, so every URL is `/#/home` rather than `/home`. There is no server rendering, prerender, or service worker. `index.html` sets `lang="en"` and the document title `MonsterpediaApp`. Route `title` values are then shown as-is (`Home`, `Dashboard`, `Entrada`, `Editar Entrada`, `Perfil`, `Wiki de Monstruos`, `Auth`, `Reset Password`). There is no meta description and no Open Graph tags.

The HTTP client is created with `authInterceptor`. Firestore and Auth do not go through `HttpClient`, so the interceptor never attaches a token to a real request. Its URL filters (`/auth`, `/main`, `/reset-password`) do not match any call site in this repo.

## Routes

| URL | Component | Guard | Who actually gets in |
| --- | --- | --- | --- |
| `/#/home` | Home | none | everyone |
| `/#/auth` | Login / register | none | everyone; an existing session is sent to `/#/dashboard` |
| `/#/reset-password` | Reset | none | everyone |
| `/#/wiki-articles` | Index | `authGuard` | any signed-in account, including unverified |
| `/#/profile` | Profile | `authGuard` | any signed-in account |
| `/#/dashboard` | Dashboard | `authGuard` + `roleGuard(USER, ADMIN)` | verified accounts only |
| `/#/entry` | Editor, create | same | verified accounts only |
| `/#/entry/:id` | Same editor, edit mode | same | verified accounts only |
| anything else | redirect to `home` |  | no 404 page |

There is no read-only article route. `ArticleOfTheDayComponent`, `SeeMoreArticlesComponent`, and `WikiArticlesComponent` all navigate to `/entry/:id`.

## Authentication and roles

`AuthService` wraps the Firebase Auth modular SDK: email/password sign-in, registration, profile update, verification email, password reset, sign-out. The current user is a `BehaviorSubject` that starts as `null` and is updated from `onAuthStateChanged`.

`mapFirebaseUser` assigns the role on the client:

```ts
const role = user.emailVerified ? UserRole.USER : UserRole.VISITOR;
```

`UserRole.ADMIN` exists in the enum and in the README matrix. Nothing reads custom claims, and nothing reads or writes a `users` collection. An administrator cannot be represented. `isActive` is hard-coded to `true`, so the inactive-user branch in `roleGuard` never runs.

`PermissionsService` implements create, edit, delete, approve, and manage-users checks. No component injects it. The dashboard renders Edit and Delete for every row. The editor loads any id it is given and does not compare `author.id` with the current user.

`authGuard` does `take(1)` on `isAuthenticated$`. Because the subject starts as `null`, the first value on a cold load is "logged out", even when Firebase is about to restore a persisted session. The guard then navigates to `/auth` and cancels the original navigation. `AuthComponent` subscribes to the same stream and, as soon as the session appears, navigates to `/dashboard`. Reloading `/#/profile`, `/#/wiki-articles`, or `/#/entry/lamia` therefore ends on `/#/dashboard`. Reloading the dashboard looks fine only because the dashboard is the bounce target. The guard does not record a return URL.

`roleGuard` does not use `take(1)` or wait until auth has resolved. A visitor (signed in, email not verified) who opens `/dashboard` or `/entry` is sent to `/home` with no message. The sidebar still shows those links.

Registration calls `updateProfile` and then `sendVerificationEmail`. The success path immediately calls `toggleMode()`, which clears the success message. The new session also trips the auth page's redirect, so a new account lands on `/home` (visitor role cannot stay on the dashboard) and never sees the confirmation copy. Login errors are rethrown by `AuthService` as `{ success, message, error }`. The login form checks `err.code`, which is not on that object, and replaces the Spanish message the service already computed with "Ocurrió un error inesperado".

Password reset calls `sendPasswordResetEmail`. The template's `@if (error()) {}` block is empty, and the error paragraph sits outside it, so the error area is always in the DOM. On the Auth emulator, an unknown address returns `auth/user-not-found` and the page prints "No se encontró un usuario con este email", which confirms whether the address is registered when Firebase enumeration protection is off.

## Entries

`IEntry` is the whole catalog record:

- `id`, `name`, `description`, `content` (markdown string)
- `commonNames`, `clasification`, `tags` (string arrays; the field is spelled `clasification`)
- `species`, `alignment`, `longevity` (strings)
- `threatLevel` (number, form says 0–10)
- `images` (string array)
- `author` (the entire `IUser`, including email, role, and verification flag)
- `date`

`EntryService` holds one Firestore collection reference, `entries`, and subscribes to the whole collection in its constructor for `getRandomEntry`. That helper is never called. Every home widget calls `getEntries()` again, so the home page opens several full-collection listeners. `getEntryById` uses `docData`. A missing document emits `undefined`, and the editor then reads `entry.name` and throws `TypeError: Cannot read properties of undefined (reading 'name')`. The error callback, which shows an `alert`, does not run for that case.

Creates use `setDoc` with a client-generated UUID. Updates use `updateDoc` with the whole object. There is no `createdAt` separate from `date`, no `updatedAt`, no version, and no `entries/{id}/revisions` collection. The editor sets `author` to whoever is signed in and `date` to `new Date()` on both create and update, so a second editor replaces the original author and the original date. The editor reads `currentUser` once, as a field initializer, which is still `null` if the editor is constructed before `onAuthStateChanged` fires.

The image control keeps `file.name` in `selectedImages`. Those strings are what get stored and later used as `<img src>`. A saved name of `dot.png` is requested as `/dot.png` and 404s. Previously stored URLs are discarded whenever a new file selection is made. The template does not list the chosen names.

Search is an in-memory `filter` over the full array. It calls `toLowerCase()` on `name`, `description`, and `species`, then `tags.some`, with no null checks. A document that has a name but no description matches a query for that name (the `||` short-circuits) and throws on any other query, so the list does not update. The dashboard row template reads `entry.author.displayName` and throws if `author` is missing, which takes down the management table.

Markdown is rendered only by `MonsterArticleComponent` on the home page, through `ngx-markdown`. The library default sanitizes with Angular's HTML sanitizer. The editor is a plain `<textarea>` with no preview.

## Home page composition

The home route is public and is the only place a signed-out person can see entry content. It is not one article:

- `ArticleOfTheDayComponent` picks `entries[random]` on every snapshot. It is not stable for a calendar day.
- `BulletinBoardComponent` picks a different random entry and always renders `./lamia.jpg`, ignoring `images`. Threat is printed as `{{ threatLevel }} / 5`.
- `MonsterArticleComponent` picks a third random entry and renders its markdown.
- `SeeMoreArticlesComponent` shuffles and shows up to ten.

An empty collection is handled by the article-of-the-day and see-more blocks. The bulletin and the article column set the random slot to `undefined` and stay on "Cargando datos..." / "Cargando entrada de la MonsterPedia...". If a document is missing `commonNames` or `clasification`, the bulletin template calls `.join` and the column errors.

## What is not in the repository

- Firestore or Storage rules, `firebase.json`, hosting config, indexes
- A `users` collection, custom claims, or an admin screen
- Revision history, drafts, approval, or optimistic concurrency
- Tests. `angular.json` sets `skipTests: true` on every schematic, and `src/` contains no `*.spec.ts`
- ESLint, despite the README listing it. There is no ESLint package or config
- CI workflows, a dependency update policy, or a production deploy pipeline
- Internationalization files. Copy is hard-coded Spanish. `extract-i18n` is declared and unused

The README's Firestore example would not match this client even if it were deployed. It expects a `users/{uid}.role` document the app never writes, so the admin branch could not succeed, and it does not validate the entry shape or stop a writer from storing someone else's email in `author`.
