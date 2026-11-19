# Design — MonsterpediaApp

**Audited:** 2026-11-19  
**Sources of truth in code:** `src/styles.css` (tokens), component CSS/HTML under `src/app/**`, screenshots in `docs/screenshots/`.

---

## 1. Intended aesthetic (as stated)

README and `styles.css` aim for a **vintage encyclopedia / occult researcher bulletin board**:

- Parchment and walnut browns
- Serif typography (Sorts Mill Goudy for titles, Crimson Text for body)
- “Pinned paper” metaphor (corner pins on cards)
- Soft surfaces (`#fffdf5`) on a brown page field

That direction is appropriate for a monster bestiary. Execution is only partially there.

---

## 2. Design tokens (current)

Defined in `:root` inside `src/styles.css`:

| Token | Value | Role |
|---|---|---|
| `--color-bg-page` | `#f5e5c3` | Page parchment (underused; `body` uses brand accent instead) |
| `--color-bg-surface` | `#fffdf5` | Cards / forms |
| `--color-brand-primary` | `#5d4037` | Header, primary buttons |
| `--color-brand-secondary` | `#6d4c41` | Borders / secondary |
| `--color-brand-accent` | `#8d6e63` | **Actual body background** |
| `--color-text-main` / `--color-text-muted` | `#4a3b31` / `#756257` | Body / muted |
| `--color-ui-pin` | `#78909c` | Decorative rivets |
| `--font-family-body` | `"Crimson Text", serif` | Body |
| `--font-family-title` | `"Sorts Mill Goudy", serif` | Titles (often incorrectly applied via Tailwind `font-['var(--font-family-title)']`) |

Utility classes: `.bg-page`, `.btn-primary`, `.tag`, `.link-primary`, etc.

**Gap:** Google Fonts (or self-hosted `@font-face`) are **never loaded** in `index.html` or CSS. The browser falls back to generic `serif`, so the distinctive type pairing never appears.

---

## 3. Layout system

- Shell: sticky brown header + optional authenticated sidebar + content wrapper.
- Home: vertical stack — hero → featured card → two-column bulletin/article → see-more grid.
- Auth: centered “pinned” card on flat brown.
- Wiki / dashboard / entry / profile: cream “board” cards with pin decorations in CSS.
- Reset password: **unstyled** relative to the rest (plain text on brown) — clear inconsistency.

Spacing and radii are mostly ad hoc Tailwind / per-component CSS rather than a shared spacing scale beyond tokens for color.

---

## 4. Component inventory (visual)

| Surface | Look | Notes |
|---|---|---|
| Header | Dark brown bar, white serif wordmark | Nav uses click handlers, not real links; no login state in header |
| Hero | Large white headline on brown | Strong first impression when empty of art |
| Article of the Day | Semi-transparent brown card, star icon | Empty state uses generic inbox icon |
| Bulletin board | Cream profile card, sepia filter on image | Hardcoded `lamia.jpg`, not entry image |
| Markdown article | Cream panel | Only markdown body; no shared reader chrome |
| See More | Grid of cards | Same generic PrimeIcons language |
| Auth | Pinned cream card | Best-executed “board” metaphor |
| Reset password | Bare form | Breaks the system |
| Wiki / dashboard | Tables/cards with threat chips | Functional, library-default iconography |

---

## 5. Iconography & motion

- Icons: **PrimeIcons** everywhere (`pi-star-fill`, `pi-inbox`, `pi-search`, …).
- No custom bestiary marks, ink stamps, or illustrated threat glyphs.
- Motion: limited to CSS hover/transitions; no intentional entrance choreography.
- README still uses emoji ornamentation (📜👹); UI itself is emoji-light but icon-generic.

---

## 6. Consistency issues (concrete)

1. **Threat scale:** bulletin board shows `{{ threatLevel }} / 5`; dashboard/editor use `/10`; schema allows 0–10.
2. **Background:** tokens define parchment page color, but `body` paints `--color-brand-accent`, so most of the app feels like a brown void rather than aged paper.
3. **Title font utility:** `font-['var(--font-family-title)']` does not resolve CSS variables the way authors expect in Tailwind — titles often render as body/fallback serif.
4. **Language mix:** Spanish product UI, English document title (`MonsterpediaApp`), English README.
5. **Auth vs reset:** auth has pins/surfaces; reset looks like an unfinished scaffold.
6. **Stat colors** (`--color-stat-*`) exist in tokens but are unused in visible UI — leftover system noise.

---

## 7. Fit for a monster encyclopedia

**What works**

- Warm brown / cream palette already says “old book” more than a SaaS dashboard.
- Pin motif and serif intent are on-theme.
- Spanish scholarly copy (“Bestiario”, “Artículo del Día”) supports lore tone.

**What feels generic / AI-default**

- Flat single-color backgrounds with rounded cards and PrimeIcons.
- Empty states that look like admin CRMs (inbox/spinner), not a bestiary.
- No hero illustration, texture, or specimen plate — first viewport is text-on-brown.
- Card grids that could belong to any Tailwind tutorial wiki.
- Soft Material-adjacent browns without ink, grain, or hand-drawn frames.

---

## 8. Hand-crafted direction (recommended)

Keep the bulletin-board / encyclopedia thesis; make it **specific**:

1. **Paper field, not brown void** — use `--color-bg-page` with subtle fiber/noise texture; float cream “clippings” with soft shadows and real pin artwork.
2. **Load the fonts** — self-host Crimson Text + a display face with ink personality (or keep Sorts Mill Goudy once loaded). Use a true `font-title` utility.
3. **Specimen plates** — every entry card should feel like a catalog plate: ruled borders, species Latin line, threat as stamped wax/seal (not a Bootstrap badge).
4. **Custom marks** — replace PrimeIcons for brand moments (threat, habitat, alignment) with a tiny SVG set in one stroke weight.
5. **Reader-first article page** — two-column dossier (traits sidebar + long-form ink body), not a form.
6. **Article of the Day** — dated ribbon, stable daily pick, illustrated frame; empty state as “shelf waiting for specimens,” not an inbox.
7. **Motion** — 2–3 deliberate moves: pin drop on cards, slow paper slide for featured entry, ink fade on markdown headings.
8. **Cull defaults** — remove unused stat tokens or use them; restyle reset-password to match auth; drop emoji from marketing chrome.

This keeps originality without inventing a second brand: deepen the researcher’s board that the code already hints at.
