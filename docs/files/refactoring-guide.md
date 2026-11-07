> Historical audit-era note: the phase 1–3 implementation replaces parts of this structure. See [architecture.md](architecture.md) for the current source of truth.

# Component refactoring guide

Historical note, translated from the original Spanish `REFACTORING_GUIDE.md`. It describes how screens were meant to be aligned with `styles.css` and Tailwind. Reset password still uses the old class names this guide says to remove. See [design.md](design.md).

The goal is to keep color and motion in `styles.css`, and to use Tailwind for layout and breakpoints.

## 1. Clean the component template

- Remove Tailwind classes that hard-code colors (`bg-[#A1887F]`, `text-white`, `border-[#5D4037]`).
- Remove Tailwind transition and duration classes. Base motion lives in `styles.css`.
- Remove retired custom classes (`font-title-main`, `content-wrapper`).

## 2. Use the design-system classes

- Backgrounds: `.bg-primary`, `.bg-secondary`, `.bg-surface`.
- Text: `.text-main`, `.text-muted`, `.text-on-primary`.
- Borders: `.border-primary`, `.border-secondary`.
- Links on light surfaces: `.link-primary`.
- Links on the dark header: `.link-on-primary`.

## 3. Layout and breakpoints

- Build structure with Tailwind flex and grid utilities.
- Use `sm:`, `md:`, and `lg:` for breakpoints.
- Hide the desktop nav on small screens (`hidden`) and show it from `md` (`md:flex`).
- For a mobile menu, add a button that is `md:hidden`, a panel, a boolean such as `isMenuOpen` on the component, and bind the panel with `[class.hidden]="!isMenuOpen"`.

## 4. Component CSS

- Put a style that belongs to one component, such as a header hover that fills the bar, in that component's CSS file.
- Name the class for the element (`.nav-link`) and apply it in the template.
