# IntelliReview AI V2 — UI Design System (Obsidian Signal)

## 1. Visual Identity: Obsidian Signal
**Obsidian Signal** is a dark-first developer workspace designed for high-density engineering environments. It prioritizes clarity, code legibility, restrained accents, and fluid tactile interactions.

---

## 2. Color Palette & Semantic Tokens

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `background-primary` | `#05070A` / `#080B10` | App canvas, Monaco background |
| `background-secondary` | `#0D121B` | Sidebars, modal backdrops |
| `panel-surface` | `#121A25` | Cards, command palettes |
| `elevated-surface` | `#192333` | Dropdowns, tooltips, popovers |
| `primary` / `cyan` | `#63E6FF` | Brand accent, active tabs, buttons |
| `secondary` / `purple` | `#8B7CFF` | Secondary indicators, AI chat badges |
| `success` | `#39D98A` | Clean scans, low risk, resolved issues |
| `warning` | `#FFB454` | Medium severity, complexity warnings |
| `danger` / `critical` | `#FF6178` | Security vulnerabilities, high severity |
| `text-primary` | `#E6F1FF` | High-contrast headings and body copy |
| `text-muted` | `#9BAFC8` | Secondary labels, descriptions, timestamps |
| `border` | `#293446` / `white/[0.08]` | Crisp dividers and container borders |

---

## 3. Typography Hierarchy

1. **Headings & Brand**: `Space Grotesk`, `sans-serif`
   - Hero displays, section headers, card titles.
2. **Interface & Body**: `Inter`, `system-ui`, `sans-serif`
   - Form inputs, navigation menus, descriptions, body text.
3. **Code & Technical Metadata**: `JetBrains Mono`, `monospace`
   - Monaco editor, finding snippets, line numbers, file paths, rule IDs.

---

## 4. Components & Motion Design

### 4.1 React Bits & Motion Elements
- **SplitText**: Subtle title entrance on landing pages without layout shift.
- **SpotlightCard**: Mouse-following subtle ambient illumination on KPI cards.
- **ElectricBorder / Magnet**: Interactive CTA buttons that react to pointer hovering.
- **GridScan**: Low-overhead ambient background grid for deep visual texture.

### 4.2 Application Shell & Workbench
- **Command Bar & Sidebar**: Collapsible navigation with keyboard shortcuts (`Cmd/Ctrl + K` Command Palette).
- **Monaco Editor**: Integrated VS Code-like code workspace with custom Obsidian dark theme, inline gutter error markers, and code navigation.
- **Split Diff Viewer**: Side-by-side comparison of original code vs suggested remediation patches.
- **Finding Inspector**: Card-based issue viewer with filterable tabs (Security, Code Quality, Performance, Complexity).

---

## 5. Accessibility & Performance
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by disabling non-essential transitions.
- **WCAG 2.1 AA Contrast**: All text tokens achieve a minimum contrast ratio of 4.5:1 against surfaces.
- **Zero Heavy 3D**: Excludes CPU/GPU-heavy WebGL/Three.js runtimes in review workspace to guarantee 60fps responsiveness on developer laptops.
