# Design — a field folio, not a dashboard theme

## Direction

A hand-crafted encyclopedia of fantastic specimens: one sheet per creature, readable notes and a framed plate. Warm parchment is the page; dark brown ink is the text. The dark header is the only large brand field. There are no AI-style gradients, pulsing stars, duplicated random cards or permanent account sidebar.

The specimen sheet is shared by home and the public article so name, taxonomy, plate, threat and prose always refer to the same creature. Home adds only a brief index of other names. Blank images become a catalogue-numbered empty plate, never an unrelated Lamia illustration. This change adds no character artwork to the repository.

## Tokens and typography

`src/styles.css` is the source of truth:

| Token | Value / role |
| --- | --- |
| `--paper` | `#fffaf0`, sheet surface |
| `--page` | `#f1e3c6`, surrounding parchment |
| `--ink` | `#35281f`, principal text |
| `--muted` | `#6b5742`, secondary text with contrast on parchment |
| `--brand` | `#342b23`, masthead |
| `--line` | `#c8b58f`, rules and paper borders |
| `--accent` | `#704b28`, links and ink details |
| `--title` | Sorts Mill Goudy, specimen/section titles |
| `--body` | Crimson Text, text and UI |

The name, section, body and metadata scale is set once. Local TTF files in `public/fonts` have `font-display: swap` and their OFL licenses. There are no external font requests or arbitrary utility font strings. Shared `.paper` defines the quiet border and offset sheet shadow for account, dashboard and editor surfaces; individual components do not duplicate multi-kilobyte style sheets.

## Folio

Desktop uses a 36% plate/taxonomy column beside the main notes. A catalogue reference sits above both. Image framing resembles a specimen plate, while the lower taxonomy reads as a small research table. Threat is an ink stamp and a ten-mark scale with a textual 0–10 value; no color-dependent green/amber/red badge. The shared map is Bajo (0–2), Medio (3–5), Alto (6–7), Crítico (8–10).

Below 680 px the columns become a single flow; the plate and its facts precede the essay. No fixed-width sidebar survives. The same header turns into an explicitly labelled, expandable menu below 900 px. It closes after choosing a destination. Buttons, visible labels, error sentences and keyboard focus remain available at both widths.

## Other screens

The index is a numbered ledger rather than an unrelated grid. Empty catalog/search/id states describe what happened and offer a path back. Account and reset forms use the same paper card and neutral status/error treatment. Dashboard rows are labelled prose lists, not a table with missing mobile headers. Delete uses an explicit confirmation panel; sign-out is a neutral outlined action rather than a Material red button.

The editor is a documentation desk with field-specific errors, upload previews, restore and save controls. Dirty navigation asks before discarding notes. Conflicting revisions show the archive version without throwing away the local draft. Form reset is deliberate and does not silently replace content.

## Evidence

The original audit images remain unchanged. Current images are `docs/screenshots/after-*`; they use emulator-only fictional entries/accounts and no new character artwork. They include the home folio, article, auth/reset, editor, user/admin cuadernos, and the signed-in mobile menu. Review at 1440 and 390 px. Automated axe WCAG A/AA checks cover home and article at both widths; keyboard/focus and visual readability still deserve human review. See [verification](verification.md).
