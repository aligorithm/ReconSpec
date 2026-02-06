# ReconSpec: Color Palette and Design Tokens

## Design Direction

ReconSpec uses a dark-mode-first design. The target audience (security engineers and penetration testers) typically works in terminals and dark-themed IDEs for extended sessions. The palette is built around deep navy-black backgrounds with electric violet as the brand accent.

The color system deliberately avoids traditional severity mapping (critical/high/medium/low) because the tool surfaces *potential* attack scenarios, not confirmed vulnerabilities. Using severity colors would imply a confidence level the tool has not earned. Instead, attack scenarios are ordered by a relevance score, and the visual hierarchy relies on layout and ordering rather than color-coded urgency.

## Typography

| Role | Font | Weights |
|------|------|---------|
| Body text, headings, UI labels | Plus Jakarta Sans | 400, 500, 600, 700 |
| Code, paths, parameters, badges | JetBrains Mono | 400, 500, 600 |

## Spacing and Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Buttons, badges, small inputs |
| `--radius-md` | 10px | Cards, panels, dropdowns |
| `--radius-lg` | 14px | Summary cards, modals, import dropzone |

## Color Tokens

### Base (Backgrounds and Surfaces)

Layered backgrounds create depth without relying on shadows. Each layer is slightly lighter than the one beneath it.

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0B0D14` | App background, deepest layer |
| `--bg-secondary` | `#131620` | Cards, panels, sidebar, top bar |
| `--bg-tertiary` | `#1C1F2E` | Nested containers, hover states on cards |
| `--bg-elevated` | `#242838` | Modals, dropdowns, popovers |

### Borders and Dividers

| Token | Value | Usage |
|-------|-------|-------|
| `--border-default` | `#2A2F42` | Standard borders on cards and inputs |
| `--border-subtle` | `#1E2235` | Light separation between sections |
| `--border-focus` | `#A78BFA` | Focus rings (matches brand for visual consistency) |

Focus rings should be at least 2px with an offset for visibility. Using the brand color for focus ensures that keyboard navigation is visually prominent without introducing a new color.

### Text

| Token | Value | Usage | Contrast on bg-primary |
|-------|-------|-------|----------------------|
| `--text-primary` | `#E8EAF0` | Body text, headings | ~15:1 (AAA) |
| `--text-secondary` | `#9399B2` | Descriptions, labels, metadata | ~5.5:1 (AA) |
| `--text-tertiary` | `#5C6280` | Placeholders, disabled text | ~3:1 (decorative only) |
| `--text-inverse` | `#0B0D14` | Text on brand-colored backgrounds | Verify per surface |

`--text-tertiary` is below WCAG AA for body text. It should only be used for decorative or supplementary content that is not essential to understanding (e.g., placeholder text that disappears on input, or disabled controls that are not actionable). All meaningful text should use `--text-primary` or `--text-secondary`.

### Brand (Electric Violet)

Electric violet was chosen because it is distinctive in the security tool landscape (most competitors use green, blue, or red), pairs cleanly with neutral tones, and avoids semantic collision with the functional color palette.

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-default` | `#A78BFA` | Primary buttons, links, active states |
| `--brand-hover` | `#C4B5FD` | Hover state on brand elements |
| `--brand-muted` | `#7C3AED` | Subtle brand accents, tags |
| `--brand-bg` | `rgba(167, 139, 250, 0.10)` | Tinted backgrounds (selected states, highlights) |
| `--brand-bg-hover` | `rgba(167, 139, 250, 0.18)` | Hover on tinted backgrounds |

### Functional (Feedback and Status)

These colors are used for system-level feedback (success, error, warning, info). They are not used for attack scenario classification.

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#4ADE80` | Successful operations, connection verified |
| `--success-bg` | `rgba(74, 222, 128, 0.10)` | Success background tint |
| `--warning` | `#FBBF24` | Validation warnings, caution states |
| `--warning-bg` | `rgba(251, 191, 36, 0.10)` | Warning background tint |
| `--error` | `#F87171` | Errors, failed connections |
| `--error-bg` | `rgba(248, 113, 113, 0.10)` | Error background tint |
| `--info` | `#60A5FA` | Informational messages, tips |
| `--info-bg` | `rgba(96, 165, 250, 0.10)` | Info background tint |

### HTTP Method Badges

These follow the widely recognized color conventions from Swagger UI and Postman. Security engineers expect these associations, so deviating would reduce usability.

| Token | Value | Method |
|-------|-------|--------|
| `--method-get` | `#60A5FA` | GET (blue) |
| `--method-post` | `#4ADE80` | POST (green) |
| `--method-put` | `#FBBF24` | PUT (amber) |
| `--method-patch` | `#C084FC` | PATCH (lighter violet, distinct from brand) |
| `--method-delete` | `#F87171` | DELETE (red) |

Method badges always include the text label (GET, POST, etc.) alongside the color. Color is never the sole means of identifying the HTTP method.

### Interactive States

| Token | Value | Usage |
|-------|-------|-------|
| `--hover-overlay` | `rgba(255, 255, 255, 0.04)` | Generic hover lift on dark surfaces |
| `--active-overlay` | `rgba(255, 255, 255, 0.06)` | Pressed/active state |
| `--disabled-opacity` | `0.4` | Applied to any disabled element |

### Relevance Score

| Token | Value | Usage |
|-------|-------|-------|
| `--relevance-text` | `#9399B2` | Same as secondary text; understated |

The relevance score is currently invisible in the UI (attack scenarios are simply ordered by it). If displayed in the future, it should use secondary text styling to remain subtle and avoid implying severity.

## Accessibility Validation

The following contrast ratios should be verified during implementation:

| Foreground | Background | Expected Ratio | Target |
|-----------|------------|----------------|--------|
| `--text-primary` on `--bg-primary` | #E8EAF0 on #0B0D14 | ~15:1 | AAA |
| `--text-secondary` on `--bg-secondary` | #9399B2 on #131620 | ~5.5:1 | AA |
| `--brand-default` on `--bg-primary` | #A78BFA on #0B0D14 | ~7:1 | AA (interactive) |
| `--text-inverse` on `--brand-default` | #0B0D14 on #A78BFA | ~7:1 | AA |
| `--method-get` on method badge bg | #60A5FA on rgba bg | Verify | AA |

All functional colors (success, warning, error, info) must be paired with labels or icons, never used as the sole indicator. This ensures the interface remains usable for people with color vision deficiencies.
