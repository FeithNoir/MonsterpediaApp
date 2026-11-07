# Design

This is the visual system that is actually in the repo, and where the screens diverge from it. The taste judgment and the proposed direction are in [audit.md](audit.md) and [improvement-plan.md](improvement-plan.md).

## Tokens

All shared tokens live in `src/styles.css` under `:root`.

| Token | Value | Role it claims |
| --- | --- | --- |
| `--color-bg-page` | `#f5e5c3` | page background |
| `--color-bg-surface` | `#fffdf5` | paper |
| `--color-bg-surface-profile` | `#fdf6e4` | warmer paper |
| `--color-text-main` | `#4a3b31` | body ink |
| `--color-text-muted` | `#756257` | secondary ink |
| `--color-text-on-primary` | `#ffffff` | text on brown |
| `--color-brand-primary` | `#5d4037` | ink brown |
| `--color-brand-secondary` | `#6d4c41` | darker brown |
| `--color-brand-accent` | `#8d6e63` | hover brown |
| `--color-border-subtle` | `#d7ccc8` | hairline |
| `--color-border-default` | `#bcaaa4` | frame |
| `--color-ui-pin` | `#78909c` | pin head (blue grey) |
| `--color-ui-pin-border` | `#546e7a` | pin rim |
| `--color-stat-strength` | `#a1887f` | unused |
| `--color-stat-agility` | `#81c784` | used as the low-threat green |
| `--color-stat-intellect` | `#7986cb` | unused |
| `--color-stat-magic` | `#ba68c8` | unused |
| `--color-stat-charm` | `#f06292` | unused |
| `--font-family-body` | `"Crimson Text", serif` | body |
| `--font-family-title` | `"Sorts Mill Goudy", serif` | titles |

Utility classes (`.bg-page`, `.bg-surface`, `.text-main`, `.btn`, `.btn-primary`, `.btn-secondary`, `.tag`, `.link-primary`) are defined next to the tokens. Tailwind 4 is imported in the same file and is used for layout. PrimeIcons is imported globally.

`body` does not use `--color-bg-page`. It uses `--color-brand-accent` (`#8d6e63`). The parchment token is never the page color. Cream is reserved for cards that sit on the brown field.

## Type

`index.html` does not load a font stylesheet, and there is no `@font-face` rule. On a machine that does not have Crimson Text or Sorts Mill Goudy installed, canvas measurements of those families are identical to generic `serif` and to a nonsense family name. The names in the tokens are requests, not delivered faces.

The wordmark makes a second mistake. The header uses Tailwind's `font-['var(--font-family-title)']`. The generated `font-family` is the literal string `"var(--font-family-title)"`, not the variable. The hero `h1` does not set the title family at all, so the largest line on the site is the body stack at 60px.

Component CSS that sets `font-family: var(--font-family-title)` (wiki title, article-of-the-day title, dashboard title) is written correctly and still falls back, because the font file is never fetched.

## The paper-and-pin motif

The distinctive idea in the codebase is a sheet of paper held by two pins. It is reimplemented, not shared:

- `auth.component.css` draws four 12px pins on `.auth-container`
- `dashboard.component.css` draws 14px pins on `.dashboard-content`
- `entry.component.css` draws the same pins on `.entry-form`
- `profile.component.css` repeats them
- `sidebar.component.css` draws two pins in a 1px-tall `.sidebar-pins` strip

Each copy uses the blue-grey pin tokens, a 2px brown border, a 6–8px radius, and the same top-to-bottom cream gradient. The logout control breaks the palette with Material red `#ef5350` / `#c62828`. Threat chips reuse `--color-stat-agility` and ad-hoc reds (`threat-critical`, `threat-high`) that are not tokens.

`REFACTORING_GUIDE.md` (now [refactoring-guide.md](refactoring-guide.md)) told authors to delete one-off color classes and use the global utilities. The auth, dashboard, entry, and profile screens mostly did that. `reset-password.component.css` is empty, and its template still uses classes that do not exist anywhere: `font-title-section`, `paper-sheet-profile`, `border-encyclopedia-accent`, `auth-btn`, `primary-btn`, `content-wrapper`. The reset screen is an unstyled form on the brown body.

## Components and iconography

Navigation icons, the article-of-the-day star, empty-state inboxes, upload, and threat triangles are PrimeIcons (`pi-home`, `pi-book`, `pi-star-fill`, `pi-inbox`, `pi-exclamation-triangle`). There is no custom icon set and no illustrated bestiary plate except `public/lamia.jpg`.

That photograph is the bulletin's only image, for every species. Article cards use `entry.images[0]` when it is a real URL and a `pi-image` placeholder otherwise.

The article-of-the-day block is styled differently from the paper cards: a 135 degree brown gradient, a pulsing star, `backdrop-filter: blur(10px)`, and a translate-on-hover. It reads as a promotional banner. The profile card and the markdown column next to it read as encyclopedia paper. They are not coordinated, and they do not display the same monster. See [home-desktop.png](../screenshots/home-desktop.png).

## Spacing, radius, and type scale

Spacing is a mix of Tailwind (`px-4`, `max-w-7xl`, `my-8`) and per-component padding (`2rem` / `2.5rem` on the paper sheets, `0.875rem` on sidebar links). Radii cluster around `0.375rem` (6px) and `0.5rem`. The global `.btn` class has the padding and radius, but `.btn-primary` only sets colors. The dashboard create button uses `btn-primary` without `btn`, so its computed padding and radius are `0`.

There is no type scale in the tokens. Sizes are local: hero 60px, auth title 32px, wiki title 40px, dashboard title 36px, body 16px.

## Layout behavior

Logged out, the header plus a single column is ordinary and usable down to 390px. See [home-mobile.png](../screenshots/home-mobile.png).

Logged in, `LayoutComponent` adds `margin-left` equal to the sidebar width: 260px, then 220, 200, and 180px as the viewport shrinks. The sidebar is `position: fixed` and is never converted into a drawer. At 390px the content column is about 210px, the logout button overlaps the page, and the wiki grid (`minmax(320px, 1fr)`) cannot fit. See [visitor-home-mobile.png](../screenshots/visitor-home-mobile.png) and [wiki-mobile-logged-in.png](../screenshots/wiki-mobile-logged-in.png).

The header still shows Inicio / Índice / Sugerir beside the sidebar, so a signed-in person has two navigation systems. Índice goes to the wiki. Sugerir goes to `/auth`, which immediately bounces a signed-in person to the dashboard.

## Contrast against the brown page

Text that sits on a cream card is fine (`#5d4037` on `#fffdf5` is about 9.2:1). Text that sits on the page background is not:

| Pair | Ratio | WCAG AA normal text (4.5:1) |
| --- | --- | --- |
| `#5d4037` on `#8d6e63` (wiki title if it used the primary token on the page) | 2.02 | fail |
| `#4a3b31` on `#8d6e63` (inherited body ink, reset-password copy) | 2.32 | fail |
| `#756257` on `#8d6e63` (muted loading text; Lighthouse measured 1.24 on the 20px line) | 1.25 | fail |
| `#ffffff` on `#8d6e63` (hero) | 4.62 | pass, narrowly |
| `#fffdf5` on `#8d6e63` (hero subtitle token) | 4.54 | pass, narrowly |
| `#ffffff` on `#ef5350` (logout label) | 3.49 | fail |

Axe, run against the signed-in wiki, reported serious contrast failures on the wiki `h1`, the subtitle, and the logout label. Lighthouse on the production home page reported the muted "Cargando entrada..." line at 1.24:1.

## What a reader actually sees

The intended mood, from the README and the hero, is an occult researcher's bulletin: one creature, a plate, a dossier. The built page is a marketing hero, a gradient feature card, a mismatched profile, a second article, and a numbered list, all using the default icon font. The pins are the only repeated handmade gesture, and they are the same 12px circles on every sheet, in a blue grey that is not part of the ink palette.
