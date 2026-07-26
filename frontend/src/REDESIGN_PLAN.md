# MOJ Case Tracker — Redesign Plan

**App:** Magistrate Court Case Tracker, Ministry of Justice, Republic of Namibia
**Scope:** All changes confined to `frontend/src/`. No backend touched. No existing functionality removed.
**Goal:** A professional, trustworthy, modern interface befitting Namibia's Magistrate Court.

---

## 1. Color Tokens

### Current problems
- `--primary: #0f1f3d` is too dark and not the Namibia flag blue
- `--accent: #b8942e` gold is not a flag colour
- No dedicated Namibia-green or Namibia-red tokens
- The real flag blue `#003580` is hardcoded on `.btn-accent` but not in the token system
- Light mode backgrounds are cool grey (`#f4f5f8`) — switch to warm neutral

### New token map (light)

```
--flag-blue:          #003580     (primary action colour)
--flag-blue-hover:    #002a66
--flag-blue-active:   #001f4d
--flag-blue-light:    #e8f0fe
--flag-blue-subtle:   #f0f5ff     (very light tint for active nav)

--flag-green:         #009543     (success / positive actions)
--flag-green-hover:   #007a36
--flag-green-light:   #e6f7ee

--flag-red:           #C8102E     (danger / high priority)
--flag-red-hover:     #a30d24
--flag-red-light:     #fde8ea

--flag-gold:          #FFD100     (warning / accent highlight)
--flag-gold-light:    #fef8e6

--warm-bg:            #f7f5f0     (warm light pages)
--warm-surface:       #fcfcfa     (warm card surface)
--warm-border:        #e6e2da     (warm borders)
```

### Mapped to current role-based tokens

| Token | Light value | Dark value |
|-------|------------|------------|
| `--primary` | `#003580` | `#3068c8` |
| `--primary-hover` | `#002a66` | `#4a7dd6` |
| `--primary-active` | `#001f4d` | `#5e8fe0` |
| `--primary-light` | `#e8f0fe` | `#132b4d` |
| `--accent` | `#009543` (green) | `#00c45a` |
| `--accent-hover` | `#007a36` | `#00d865` |
| `--accent-light` | `#e6f7ee` | `#0a2e18` |
| `--danger` | `#C8102E` | `#ef4455` |
| `--danger-light` | `#fde8ea` | `#450a10` |
| `--warning` | `#FF8C00` (amber for priority) | `#f59e0b` |
| `--warning-light` | `#fef3c7` | `#422006` |
| `--page-bg` | `#f7f5f0` | `#0f0d0a` |
| `--surface` | `#ffffff` | `#1a1712` |
| `--surface-hover` | `#f5f3ee` | `#221f19` |
| `--surface-active` | `#ebe8e0` | `#2d2922` |
| `--border` | `#e6e2da` | `#2d2922` |
| `--border-hover` | `#d4cec2` | `#3d382e` |
| `--border-focus` | `#8a8272` | `#5a5246` |
| `--text-primary` | `#1a1612` | `#f0ece5` |
| `--text-secondary` | `#5c5448` | `#a0988a` |
| `--text-tertiary` | `#9a9284` | `#6a6256` |

### Chart colours
Replace arbitrary `CHART_COLORS` with Namibia-inspired palette:
```
--chart-1: #003580
--chart-2: #009543
--chart-3: #C8102E
--chart-4: #FFD100
--chart-5: #8B4513  (warm brown, for 5th series)
--chart-6: #4A90D9  (light blue variant)
```
Import these into `Dashboard.js` and any chart components instead of the inline array.

---

## 2. Typography Tokens

### Current problems
- Only system sans-serif used throughout
- No typographic hierarchy — buttons, headings, body all same family
- No court/institution gravitas

### New font stack
- **Display headings (h1, h2, page titles):** `Playfair Display` — serif, South African/Namibian professional feel. Fallback: Georgia.
- **Body copy, labels, tables, inputs:** `Inter` — clean, excellent readability. Fallback: system sans-serif.
- **Code, case numbers:** `JetBrains Mono` — monospace for case numbers, hearing times. Fallback: SF Mono, Consolas.
- **Login page decorative elements:** Playfair Display for "Ministry of Justice" wordmark.

### Token additions
```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono:    'JetBrains Mono', 'SF Mono', 'Consolas', monospace;
```

### Size scale
| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--text-xs` | 0.7rem | 400 | Meta, timestamps |
| `--text-sm` | 0.8rem | 400 | Table cells, labels |
| `--text-base` | 0.9rem | 400 | Body, paragraphs |
| `--text-lg` | 1.05rem | 600 | Card titles |
| `--text-xl` | 1.3rem | 700 | Page headings (serif) |
| `--text-2xl` | 1.75rem | 700 | Dashboard hero |
| `--text-3xl` | 2.2rem | 800 | Login welcome |

### Application
- All `<h1>` / page titles: `font-family: var(--font-display);`
- `.stat-card-value`: `font-family: var(--font-display); font-weight: 700;` (numbers read with gravitas)
- `.case-number`: `font-family: var(--font-mono);`
- Sidebar brand: Playfair Display for "Ministry of Justice"
- Login header brand: Playfair Display, larger size

---

## 3. Component Specs

### 3.1 Cards (GlassCard + .card + .stat-card + .chart-card)

**Current:** `.card` is a flat white surface with border + shadow. `GlassCard` only used on login. `stat-card` and `chart-card` are flat.

**Redesign:**

All cards get a subtle upgrade while keeping their distinct roles:

**Dashboard stat cards:**
- Background: semi-transparent surface with `backdrop-filter: blur(12px)` (glassmorphism)
- Border: 1px `rgba(255,255,255,0.12)` in light, `rgba(255,255,255,0.06)` in dark
- Backdrop: subtle gradient overlay on the page background
- Hover: lift with `translateY(-2px)` + shadow increase (0.2s ease)
- Icon container: circular with soft gradient background
- Value: Playfair Display, `--flag-blue` colour

**Chart cards:**
- Same glassmorphism treatment but slightly more opaque for chart legibility
- Title row uses a thin accent bar on the left edge (--flag-blue or --flag-green)

**Standard cards (.card):**
- Keep flat for content density (tables inside cards should remain crisp)
- Add subtle left border accent using `border-left: 3px solid var(--primary)` on `.card-header`
- Card header backgrounds: subtle tint of `--primary-light`

**GlassCard component:**
- Refine the backdrop blur: currently `blur(16px)` — keep but add a subtle `::before` gradient overlay for depth
- Add dark mode variant (currently glass looks good in dark, but needs testing)

**Implementation:** Update `index.css` `.card`, `.stat-card`, `.chart-card`, and `GlassCard.js`.

### 3.2 Buttons

**Current:** Basic primary/ghost/danger with colour transitions.

**Redesign:**

**Primary button (`.btn-primary`):**
- Background: `--flag-blue` (= current `.btn-accent`)
- Hover: slight lift `translateY(-1px)` + deeper shadow
- Active: `scale(0.97)` (already present on `.btn-accent`)
- Focus: ring with `box-shadow: 0 0 0 3px var(--flag-blue-light)`
- Incorporate the `.btn-accent` class into the `.btn-primary` token system, then remove `.btn-accent` as a separate class (migrate all uses)

**Green accent button (`.btn-accent` renamed to `.btn-success` or keep as secondary):**
- Background: `--flag-green`
- For positive/confirm actions (Save, Create, Approve)

**Danger button (`.btn-danger`):**
- Background: `--flag-red`
- Add subtle red glow on hover

**Ghost button (`.btn-ghost`):**
- Keep minimal, add subtle `backdrop-filter: blur(4px)` on hover for depth
- Border: `var(--warm-border)` → hover: `var(--border-hover)`

**Icon buttons:**
- Standardize 36x36px size for standalone icon buttons
- Circular shape with hover background

### 3.3 Forms & Inputs

**Current:** Basic inputs with thin border, minimal focus state.

**Redesign:**

**Text inputs / selects / textareas:**
- Background: `var(--surface)` with subtle inner shadow on focus
- Border: `var(--border)` → focus `var(--flag-blue)` with `box-shadow: 0 0 0 3px var(--flag-blue-light)`
- Label: slightly larger `0.85rem`, font-weight 600, colour `var(--text-secondary)`
- Placeholder: colour `var(--text-tertiary)`, italic
- Transition: all 0.2s ease (border, shadow, background)

**Focused state:**
```
.form-input:focus {
  border-color: var(--flag-blue);
  box-shadow: 0 0 0 3px var(--flag-blue-light);
  background: var(--surface);
}
```

**Error state:**
- Border: `--flag-red` with red-tinted shadow
- Error message: small red text below with slide-in animation

**Search field (.search-field):**
- Rounder radius (12px), pill-like
- Subtle glass background with blur
- Focus: expand slightly, flag-blue border

### 3.4 Tables

**Current:** Basic bordered table, hover on rows, no sticky headers.

**Redesign:**

**Sticky headers:**
```css
.table th, .table-container table th {
  position: sticky;
  top: 0;
  z-index: 2;
  /* Already has background, ensure it stays */
}
```

**Row design:**
- Alternating subtle stripe (optional, could just use hover)
- Row hover: `background: var(--surface-hover)` with subtle `translateX(2px)` movement on first cell (using motion)
- Clickable rows: pointer cursor, subtle active press state
- Selected row: `background: var(--flag-blue-light)` with left blue border indicator

**Column sizing:**
- Add `width` hints for common columns (case number, status, priority, actions)
- Status badges: keep pill design, colourize with new flag palette

**Sort headers:**
- Click animation: gentle bounce on sort direction change
- Active sort column: subtle background tint

### 3.5 Sidebar

**Current:** Standard sidebar with nav items, footer with user info + theme toggle.

**Redesign:**

**Visual:**
- Background: glassmorphism effect (`backdrop-filter: blur(20px)`) with semi-transparent surface in both modes
- Or: keep solid but add a subtle Namibian flag gradient strip at the top (blue → green → red, 4px height)
- Width: keep 220px, but add a collapse mode (hamburger → icon-only on hover)

**Nav items:**
- Active state: left accent bar (3px, `--flag-blue`) instead of just background colour
- Subtle hover: background tint + icon colour shift
- Icons: slightly larger (18px), consistent stroke width
- Add micro-transitions on active indicator (slide in from left)

**Brand section:**
- Coat of arms + "Ministry of Justice" in Playfair Display
- Below: "Republic of Namibia" in smaller Inter, `--text-tertiary`

**Theme toggle:**
- Redesign as a single button that cycles (light → dark → system) rather than three tiny buttons
- Or keep three but make them larger (28x28) with icon transition

**Footer user section:**
- Avatar: slightly larger (36px), with subtle border
- Name/role: better typography hierarchy
- Logout button with subtle hover effect

### 3.6 Topbar

**Current:** Simple header with title, subtitle, search, notification bell, date.

**Redesign:**

**Background:**
- Glassmorphism: `backdrop-filter: blur(16px)` with semi-transparent background
- Subtle bottom border with gradient (`--flag-blue` to transparent)
- On scroll: add shadow

**Title area:**
- Page title in Playfair Display
- Subtitle in Inter, `--text-tertiary`, slightly smaller

**Date display:**
- Format: styled pill with calendar icon and date
- On click: show a small dropdown calendar (nice-to-have)

**Note:** The `.topbar` already has `position: sticky; top: 0; z-index: 50;` — keep this but add the blur.

### 3.7 Modals

**Current:** Functional, centered, animated with motion.

**Redesign:**

- Overlay: darker background with stronger blur (4px)
- Modal header: add left accent border on h3
- Body: better spacing, larger max-width for content-heavy modals
- Footer: consistent button placement (right-aligned actions, destructive left)
- Animation: current slide-up + fade is good — add slight scale bounce on spring
- Close button: larger hit area, subtle hover rotation

---

## 4. Page-Specific Changes

### 4.1 Login Page

**Current:**
- Background image of courthouse with dark overlay
- GlassCard with logo, form, and footer text
- Court-bg.jpg background

**Redesign:**
- Keep the background image but add an animated gradient overlay (Namibia flag colours softly shifting)
- Welcome message: "Welcome to the Magistrate Court Case Tracker" in Playfair Display above the form
- Form fields: improved focus states per 3.3
- Button: full-width primary with subtle pulse animation on load
- Footer: add version number and "Ministry of Justice, Republic of Namibia" in warm tone
- Accessibility: ensure colour contrast on all states
- Mobile: better padding, full-bleed background

### 4.2 Dashboard

**Current:**
- Stat cards in a grid (4 items)
- Bar chart + status bars + line chart
- Recent cases table at bottom
- Skeleton loading states

**Redesign:**
- Stat cards with glassmorphism (per 3.1)
- Chart colours updated to Namibia palette
- Page title "Dashboard" in Playfair Display
- Add a subtle pattern/background texture behind the dashboard (optional: thin map of Namibia watermark)
- Recent cases table: sticky header, row hover with left accent
- Loading skeletons: match the new card heights, shimmer animation in flag-blue
- Empty state: illustrated (see section 4.7)
- Responsive: charts stack in single column on mobile

### 4.3 Cases Page

**Current:**
- Filter bar with search, selects, create/export buttons
- Table with sortable headers, pagination
- Create/edit modal + detail modal

**Redesign:**
- Filter bar: pill-shaped selects with glass background, search field per 3.3
- New Case button: prominent, green accent (`--flag-green`)
- Table: sticky headers per 3.4
- Row click: slide transition to detail view (or modal)
- Empty state: show gavel/scale illustration with "No cases match your filters" message
- Loading: skeleton per table spec
- Export: subtle dropdown or button with download icon
- Pagination: centred, better button styling, per-page selector as a select
- Case detail modal: tabs with underline animation, document previews

### 4.4 Calendar Page

**Current:**
- Month grid with session chips, modals for CRUD
- Summary bar, courtroom filter

**Redesign:**
- Calendar grid: top header with Namibia-flag-colour gradient strip
- Today cell: glow effect (subtle box-shadow in primary)
- Session chips: use new badge colours aligned with session type
- New Session FAB: green accent button with plus icon, positioned fixed bottom-right
- Empty state: calendar with "No sessions scheduled" and a CTA
- Navigation month buttons: pill design with hover lift
- Summary bar: left-border accent per session type

### 4.5 Users Page

**Current:**
- Table with inline actions (edit, toggle, delete)
- Modal for create/edit

**Redesign:**
- Table: sticky header, row styling per 3.4
- Status: toggle switch instead of text button (active/disabled with visual switch)
- Role badges: colorized with flag palette (admin=blue, manager=green, clerk=gold)
- Actions: icon toolbar with tooltips
- Delete: confirmation modal instead of browser confirm()
- Empty state: "No users yet — add your first user"
- Create/Edit modal: improved form layout with field groups

### 4.6 Reports Page

**Current:**
- 3 report cards in grid (Case Summary, Session Roster, Case Register)
- Each has form fields + download button

**Redesign:**
- Report cards: glassmorphism treatment with left accent bar
- Icons: larger, Namibia-flag colored
- Download button: green accent when ready, blue if still selecting
- Loading state: shimmer on button text "Generating..."
- Empty/error state: per 4.7
- Add progress bar during PDF generation (even if simulated)
- Responsive: single column on mobile

### 4.7 Empty & Error States (Global)

**Current:** Basic text-only empty states with simple SVG icons.

**Redesign:**
- Every data-fetching component gets a rich empty state with:
  - Illustration: custom SVG inline art (gavel, scales, folder, calendar, chart, users)
  - Title: friendly but professional ("No cases to display")
  - Description: helpful message with guidance
  - CTA button: primary action (Create, Adjust filters, etc.)
- Error states:
  - Error icon in flag-red (`#C8102E`)
  - Error message in `--text-secondary`
  - Retry button with refresh icon
- Loading states:
  - Skeleton shapes matching actual card/table dimensions
  - Shimmer animation using `--flag-blue-light` gradient

### 4.8 Visualisations Page

**Current:**
- Grid of visualisation cards with search, categories, drag-and-drop reorder
- Playlist sidebar, builder modal

**Redesign:**
- Card grid: glassmorphism cards
- Category buttons: pill-shaped, active state with flag-blue
- Favourites: gold star icon in `--flag-gold`
- Drag handle: more visible with grip icon
- Builder modal: improved form layout with preview pane
- Empty state: chart icon + "Build your first visualisation"
- Playlist panel: left-icon accent per vis type

---

## 5. Magic UI / Animation Integration Points

### What we already have
- `motion` (framer-motion) is installed and used across all pages
- Page transitions: fade + slide (`AnimatePresence mode="wait"`)
- Staggered list animations for table rows, stat cards, vis cards
- `whileHover` and `whileTap` on buttons and nav items

### Additions

**5.1 Page transitions**
- Current: fade + vertical slide (6px). Keep this but add a subtle scale (0.995 → 1) for polish
- Duration: 0.25s ease-out

**5.2 Micro-interactions**
- All interactive elements get `whileHover` with `whileTap`
- Cards: hover lift (translateY -2px, shadow increase, 0.2s spring)
- Buttons: hover scale 1.02, tap scale 0.97
- Table rows: hover background change + left border reveal (animated width 0→3px)
- Sidebar links: hover translateX(4px) with spring
- Theme toggle: icon rotation on switch (sun → moon with rotateY)
- Badges: subtle scale on mount (spring)

**5.3 Staggered mount animations**
- Stats grid: stagger 0.06s (already done)
- Table rows: stagger 0.025s (already done)
- Vis cards: stagger 0.04s (already done)
- Notification list: stagger 0.02s (already done)
- Add to Calendar cells: stagger 0.015s on month change

**5.4 Scroll-triggered animations**
- For dashboard charts: animate on scroll into view using `useInView` from motion
- Stat cards: count-up animation for numbers (animate from 0 to actual value)

**5.5 Dark mode transitions**
- All colour transitions: `transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;` on body
- Smooth toggling between light/dark/system

**5.6 Focus rings**
- All focusable elements: 3px solid outline with offset, using `--flag-blue-light`
- Keyboard navigation: visible focus indicator at all times

**5.7 Loading skeletons**
- Use motion for skeleton fade-in
- Shimmer animation with `--flag-blue-subtle` instead of grey

---

## 6. Implementation Order

### Phase 1: Foundation (index.css + ThemeContext)
1. Update CSS custom properties (flag colours, warm neutrals, typography)
2. Add Playfair Display, Inter, JetBrains Mono via Google Fonts `<link>` in `public/index.html`
3. Add font-family tokens and apply to body, headings, mono elements
4. Update dark mode variants for all new colours
5. Add `transition` on body for smooth dark mode switching

### Phase 2: Component Polish
6. Refactor `.btn-accent` into `.btn-primary` token system
7. Update all button styles (hover, active, focus rings)
8. Add glassmorphism to `.stat-card`, `.chart-card`, `.card` (subtle)
9. Add sticky headers to all tables
10. Improve form input focus states
11. Redesign sidebar active indicator (left accent bar)
12. Add glassmorphism + scroll shadow to topbar

### Phase 3: Page-by-Page
13. Login page: typography, welcome message, animated overlay
14. Dashboard: stat card glass, chart colours, count-up animation
15. Cases: table row left-border reveal, empty state illustrations
16. Calendar: today glow, FAB button, colour updates
17. Users: toggle switch, role colour mapping, confirm modals
18. Reports: glass cards, progress state, empty states
19. Visualisations: glass cards, category pills, drag handle

### Phase 4: Polishing
20. Empty state illustrations across all pages
21. Error state improvements
22. Responsive refinements for mobile
23. Dark mode QA pass on every component
24. Keyboard focus indicator QA

---

## 7. Files to Create

| File | Purpose |
|------|---------|
| `frontend/src/components/EmptyState.js` | Reusable empty state with illustration slot, title, description, CTA |
| `frontend/src/components/ErrorState.js` | Reusable error state with retry |
| `frontend/src/components/LoadingSkeleton.js` | Configurable skeleton component matching card/table shapes |
| `frontend/src/components/StatCard.js` | Extracted dashboard stat card with glassmorphism |
| `frontend/src/components/ThemeToggle.js` | Extracted theme toggle with icon transitions |

## 8. Files to Modify

| File | Changes |
|------|---------|
| `index.css` | Full colour token replacement, typography, glassmorphism classes, sticky headers, focus rings |
| `public/index.html` | Google Fonts link for Playfair Display, Inter, JetBrains Mono |
| `App.js` | Import new font classes, page title updates |
| `context/ThemeContext.js` | Add `data-theme-transitioning` class for 0.3s crossfade |
| `components/Sidebar.js` | New active indicator, theme toggle component, brand typography |
| `components/GlassCard.js` | Dark mode refinement, gradient overlay |
| `components/Logo.js` | Larger login variant with serif font |
| `components/SearchBar.js` | Pill shape, glass background |
| `components/NotificationBell.js` | Badge count animation refinement |
| `pages/Login.js` | Welcome message, animated overlay, serif branding |
| `pages/Dashboard.js` | Namibia chart colours, glass stat cards, count-up animation, Playfair headings |
| `pages/Cases.js` | EmptyState/ErrorState components, row left-border, new filter pill styles |
| `pages/Calendar.js` | Today glow, FAB styling, session colour tokens |
| `pages/Users.js` | Toggle switch, confirmation modal, role colours |
| `pages/Reports.js` | Glass cards, progress states, EmptyState |
| `pages/Visualisations.js` | Glass cards, category pills, EmptyState |

---

## 9. Design Rationale Summary

- **Namibia flag colours** anchor the app in national identity — this is a court system, not a generic enterprise tool
- **Playfair Display serif** conveys tradition, authority, and trustworthiness — essential for a Magistrate Court application
- **Warm neutral backgrounds** make the interface feel welcoming rather than sterile; court personnel spend all day in this system
- **Glassmorphism** on cards signals modernity without being frivolous — the blur effect creates depth hierarchy naturally
- **Micro-interactions** (hover lifts, spring animations, staggered mounts) make the app feel responsive and polished, which builds user confidence
- **Rich empty states** eliminate confusion — users always understand what to do next, even on first use
- **Dark mode** respects court staff working evening shifts or in dimly-lit courtrooms
