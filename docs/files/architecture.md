# Architecture — phases 1–3 implementation

## Runtime and boundaries

Angular 21.2 standalone, zoneless application. `app.component.ts` owns the only navigation, skip link, main landmark and footer. Routes load page components lazily. `styles.css` owns the shared paper and typography system. There is no permanent sidebar, external API interceptor, PrimeNG theme or Tailwind pipeline.

`core/firebase.ts` provides one app/Auth/Firestore/Storage instance through the `FIREBASE` token. AngularFire 21 providers expose these same instances; service calls use the modular Firebase SDK directly rather than invoking AngularFire wrappers outside an injection context. The public client config is committed. A separate compile-time emulator configuration connects all three clients to loopback before use. Production cannot be redirected by a query parameter.

## Routes

| Route | Read access / purpose |
| --- | --- |
| `/home` | Public, one deterministic UTC daily specimen |
| `/wiki-articles?q=` | Public, null-safe searchable index |
| `/article/:id` | Public article, plates, taxonomy, last five revision snapshots |
| `/auth`, `/reset-password` | Public account forms |
| `/profile` | Authenticated; verification explanation, public-name update, sign-out |
| `/dashboard` | Verified; own entries, or all entries for admin |
| `/entry`, `/entry/:id` | Verified; create, or edit only the original author/admin |
| unknown route/id | Explicit not-found state, never a silent home redirect |

Hosting rewrites clean deep links to `index.html`. `main.ts` converts old `/#/route` bookmarks before bootstrap.

## Auth and roles

`AuthService.currentUser$` is a ReplaySubject without an initial null value. Guards wait for Firebase's first real auth callback and role lookup, then `take(1)`. The signed-out guard preserves a local return URL, and login honors it. Registration goes to profile with durable success feedback. Profile reloads the user/token so email verification is reflected without a manual browser refresh.

Roles come from trusted `admins/{uid}` and optional `editors/{uid}` documents, **not custom claims** (this intentionally supersedes the audit's original proposal). Only the current account can get its marker; no client can list or write role documents. A failed lookup cannot promote a user. The marker's existence is authoritative, not its `enabled` value. The UI refreshes markers on login/profile reload; rules check current existence on every write. Optional editors have the same ownership-limited editing rights as normal verified users. All writers, including administrators, must be verified.

`PermissionsService` drives dashboard actions, public article Edit, and editor denial states. Rules independently enforce the same policy. Private account data stays in Firebase Auth; no public `users` collection is required or allowed.

## Data model

`entries/{id}` contains only:

- `name` (1–120), `description` (1–1000), `species`, `alignment`, `longevity` (1–120), `content` (1–50000): strings.
- `commonNames`, `clasification`, `tags`: at most **5 strings**, each at most 80 characters. The existing `clasification` spelling is retained to avoid inventing a second legacy field.
- `images`: at most **4 uploaded Storage download URLs**, each at most 2048 characters.
- `threatLevel`: integer 0–10.
- `authorId` (1–128), `displayName` (1–80, no email-style `@`): public attribution only.
- `createdAt`, `updatedAt`: Firestore timestamps; `version`: positive integer.

The document id is read metadata and is not saved as a field. The client never embeds the Firebase user or copies an email into a public document. `normalizeEntry` is a read boundary for null/malformed legacy content, not a replacement for migration or write validation. Missing legacy timestamps/version prevent silent conflict overwrites.

`EntryService` owns one shared entries listener and loading/error state. Home hashes the UTC date into the stable id-sorted list; a timer updates the date for tabs left open overnight. The same specimen component renders its plate, taxonomy and Markdown. Search normalizes Spanish case and skips absent/malformed fields. It remains intentionally client-side.

## Saves, revisions and conflicts

Creation assigns the current verified uid/display name, server timestamps and version 1. The editor constructs a whitelisted content payload; it never submits authorId/createdAt from a form.

Updates run a Firestore transaction: read the current entry, compare version **and** `updatedAt` against the loaded original, save the full previous public snapshot to `entries/{id}/revisions/{previousVersion}`, then update content/version/server time. Rules require that previous snapshot and editor uid in the same atomic write. Revisions are immutable; they cannot be fabricated separately, rewritten or deleted by clients. The article queries `createdAt desc, limit 5`; single-field indexes are automatic, so `firestore.indexes.json` has no composite indexes.

A conflict retains the local draft, shows the remote version and offers an explicit reload. A dirty `canDeactivate`/beforeunload guard protects unsaved work. Deletes require a verified administrator and a second UI confirmation. Deleting the parent makes orphan revisions unreadable; physical cleanup is a future trusted-server task.

## Storage

Upload selected bytes with `uploadBytes`, then persist `getDownloadURL`. Paths are `users/{uid}/entries/{entryId}/{uuid}`. Client and Storage rules validate image MIME allowlist and a 5 MiB cap. Only the verified path owner writes/deletes; reads are public. Preview and remove controls preserve other images. Removing a URL does not delete its object, so cancelling an editor can leave unreferenced uploads. Server cleanup/content scanning are deferred. MIME validation is not a claim of magic-byte or malware inspection.

## Rendering and SEO

`marked` parses Markdown after escaping raw `<`. Angular sanitizes the resulting HTML; there is no bypassSecurityTrustHtml. Real h1/meta text is set per route/article. These are client-side tags, not SSR or guaranteed social crawler previews. Fonts are self-hosted with OFL licenses and `font-display: swap`.

## Verification/deploy

Vitest tests pure helpers, restore/role guards, permissions and form safety. Rules-unit-testing runs denial/allow matrices against local Firestore/Storage. Playwright runs isolated desktop/mobile anonymous, verified, unverified and admin flows against Auth/Firestore/Storage emulators, including real uploads and revision writes. CI builds/tests only; deployment remains manual. See [README](../../README.md) and [verification](verification.md). Production and legacy data have not been changed.
