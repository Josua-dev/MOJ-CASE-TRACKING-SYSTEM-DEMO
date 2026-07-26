# MOJ Case Tracking System — Design System

**Ministry of Justice, Republic of Namibia**

> Production-ready design token catalog, component recipes, and architectural guidelines for the MOJ Case Tracker application.

---

## Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Spacing Scale](#3-spacing-scale)
4. [Border Radii](#4-border-radii)
5. [Shadow System](#5-shadow-system)
6. [Glassmorphism Tokens](#6-glassmorphism-tokens)
7. [Animation & Motion Tokens](#7-animation--motion-tokens)
8. [Component Recipes](#8-component-recipes)
9. [Theme Architecture](#9-theme-architecture)
10. [Responsive Breakpoints](#10-responsive-breakpoints)

---

## 1. Color Palette

### 1.1 Brand Colors

The brand is rooted in Namibia's national identity. The primary palette derives from the flag's blue, gold, green, white, and red.

| Token | Light Hex | Dark Hex | Usage |
|---|---|---|---|
| `--primary` | `#0f1f3d` | `#244380` | Primary buttons, links, active states, brand backgrounds |
| `--primary-hover` | `#162b52` | `#2b5099` | Button hover, link hover |
| `--primary-active` | `#1c3566` | `#3460b3` | Button pressed state |
| `--primary-light` | `#ebeff5` | `#16264a` | Subtle primary backgrounds (badges, table hover, focus rings) |
| `--accent` | `#b8942e` | `#d4a830` | Accent actions, gold highlights (Namibia flag gold) |
| `--accent-hover` | `#a8831e` | `#c4992a` | Accent hover |
| `--accent-active` | `#967312` | `#b08a22` | Accent pressed |
| `--accent-light` | `#fef8e6` | `#2a2410` | Subtle accent backgrounds |

### 1.2 Namibia Flag Colors (Derived)

The system uses Namibia's national flag as a design influence:

- **Blue** (`#0f1f3d` / `#003580`): Primary brand — represents the sky, Atlantic Ocean, and national identity
- **Gold / Yellow** (`#b8942e` / `#d4a830`): Accent — represents the sun and dunes
- **Green** (`#0d7c3f` / `#22c55e`): Success / positive states — represents agriculture and the national team
- **Red** (`#b91c1c` / `#ef4444`): Danger / urgency — represents the nation's blood spilled for freedom
- **White** (`#ffffff` / `#edf2f7`): Surface backgrounds, text inverse

### 1.3 Surface & Background

| Token | Light Hex | Dark Hex | Usage |
|---|---|---|---|
| `--page-bg` | `#f4f5f8` | `#0b1120` | Main page background |
| `--surface` | `#ffffff` | `#131c2f` | Card, modal, sidebar backgrounds |
| `--surface-hover` | `#f8f9fb` | `#18223a` | Hover state for surface elements |
| `--surface-active` | `#eef0f4` | `#1e2a45` | Active/pressed surface state |
| `--surface-raised` | `#ffffff` | `#1a2540` | Elevated surfaces (dropdowns, search panels) |

### 1.4 Border Colors

| Token | Light Hex | Dark Hex | Usage |
|---|---|---|---|
| `--border` | `#e2e5eb` | `#1e2d4a` | Default borders on cards, inputs, tables |
| `--border-hover` | `#c8cdd6` | `#2a3f66` | Border hover (cards, inputs) |
| `--border-focus` | `#8b96a8` | `#4a6a99` | Focus ring on inputs and interactive elements |

### 1.5 Text Colors

| Token | Light Hex | Dark Hex | Usage |
|---|---|---|---|
| `--text-primary` | `#0f1724` | `#edf2f7` | Body text, headings |
| `--text-secondary` | `#475569` | `#9baec4` | Secondary text, labels, meta |
| `--text-tertiary` | `#94a3b8` | `#5a7396` | Muted text, placeholders, captions |
| `--text-inverse` | `#ffffff` | `#0f1724` | Text on primary/dark backgrounds |

### 1.6 Semantic Colors

| Token | Light Hex | Dark Hex | Usage |
|---|---|---|---|
| `--success` | `#0d7c3f` | `#22c55e` | Positive states, open badge |
| `--success-light` | `#e6f7ee` | `#052e16` | Success badge/alert backgrounds |
| `--danger` | `#b91c1c` | `#ef4444` | Errors, destructive actions, high priority |
| `--danger-light` | `#fde8e8` | `#450a0a` | Danger badge/alert backgrounds |
| `--warning` | `#b8860b` | `#eab308` | Warning, medium priority, pending state |
| `--warning-light` | `#fef3c7` | `#422006` | Warning badge/alert backgrounds |
| `--info` | `#1e6bb8` | `#3b82f6` | Informational, active state, low priority |
| `--info-light` | `#e8f0fe` | `#0c192e` | Info badge backgrounds |

### 1.7 Badge Semantic Mapping

| Badge | Token | Variant |
|---|---|---|
| Open | `--success` / `--success-light` | `badge-open` |
| Active | `--info` / `--info-light` | `badge-active` |
| Pending | `--warning` / `--warning-light` | `badge-pending` |
| Closed | `--text-tertiary` / `--surface-active` | `badge-closed` |
| Criminal | `--danger` / `--danger-light` | `badge-criminal` |
| Civil | `--info` / `--info-light` | `badge-civil` |
| Family | `--accent` / `--accent-light` | `badge-family` |
| Commercial | `--primary` / `--primary-light` | `badge-commercial` |
| Labour | `--success` / `--success-light` | `badge-labour` |
| High Priority | `--danger` / `--danger-light` | `badge-high` |
| Medium Priority | `--warning` / `--warning-light` | `badge-medium` |
| Low Priority | `--info` / `--info-light` | `badge-low` |

### 1.8 Chart Color Palette (10 colors)

```css
/* Data visualization color sequence */
#1e6bb8  /* Blue */
#0d7c3f  /* Green */
#b8942e  /* Gold */
#b91c1c  /* Red */
#6b48d1  /* Purple */
#cbd5e1  /* Slate */
#14b8a6  /* Teal */
#f97316  /* Orange */
#ec4899  /* Pink */
#8b5cf6  /* Violet */
```

Chart color themes available: `default`, `warm`, `cool`, `forest`, `mono`.

---

## 2. Typography

### 2.1 Font Family

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

The system font stack ensures native rendering on each platform. No custom fonts are loaded — this improves performance and eliminates FOUT (Flash of Unstyled Text).

Monospace for case numbers and code:

```css
font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
```

### 2.2 Base Font Size

```css
html { font-size: 15px; }
```

15px base (slightly larger than the browser default 16px) for improved readability in a professional context.

### 2.3 Type Scale (Derived)

| Usage | Size | Weight | Line Height |
|---|---|---|---|
| Dashboard heading (h1) | `1.4rem` (~21px) | 700 | 1.2 |
| Page title (h1) | `1.3rem` (~19.5px) | 600 | 1.3 |
| Card title (h2/h3) | `0.95rem`–`1.05rem` | 600 | 1.3 |
| Detail title (h4) | `1rem` (~15px) | 600 | 1.3 |
| Body / Form label | `0.85rem` (~12.75px) | 400–500 | 1.4–1.5 |
| Small body | `0.82rem` (~12.3px) | 400 | 1.4 |
| Caption / Badge | `0.75rem`–`0.8rem` | 500–600 | 1.3 |
| Micro (labels, meta) | `0.65rem`–`0.7rem` | 600 | 1.3 |
| Sidebar ministry name | `0.8rem` | 600 | — |
| Sidebar republic name | `0.65rem` | 400 | — |
| Login ministry name | `1rem` | 600 | — |
| Stat card value | `1.6rem` (~24px) | 700 | 1.2 |

### 2.4 Font Weights

| Weight | Usage |
|---|---|
| 400 (Regular) | Body text, most UI text |
| 500 (Medium) | Active nav links, buttons, labels, form labels |
| 600 (Semibold) | Subheadings, table headers, nav labels, buttons |
| 700 (Bold) | Page titles, stat values |

### 2.5 Text Utilities

```css
.text-center  { text-align: center; }
.text-muted   { color: var(--text-tertiary); }
.text-xs      { font-size: 0.75rem; }
.text-sm      { font-size: 0.82rem; }
```

---

## 3. Spacing Scale

The spacing scale is 4px-based, following a modified 4px grid:

| Token | Value | Typical Usage |
|---|---|---|
| `--space-1` | `4px` | Compact padding between elements, badge inner spacing |
| `--space-2` | `8px` | Button padding, gap between small elements, form gaps |
| `--space-3` | `12px` | Standard gap in controls, internal padding, icon gaps |
| `--space-4` | `16px` | Card padding, modal padding, section spacing |
| `--space-5` | `20px` | Page content padding, card header spacing |
| `--space-6` | `24px` | Wide gaps, glass card padding |
| `--space-8` | `32px` | Section margins, empty state padding |
| `--space-10` | `40px` | Large page sections |
| `--space-12` | `48px` | Maximum spacing between major layout blocks |

---

## 4. Border Radii

```css
--radius-sm: 4px;   /* Badges, small buttons, theme toggle, pagination */
--radius-md: 6px;   /* Buttons, inputs, cards, stat cards, modals */
--radius-lg: 8px;   /* Cards, modals, dropdown panels, search panel */
--radius-xl: 12px;  /* Glass cards, modal base, login card */
```

Pill shapes (e.g. `border-radius: 10px` or `20px`) are used for:
- Badges (`border-radius: 10px`)
- Search bar input (`border-radius: 20px`)
- Status indicator dots (`border-radius: 50%`)
- Avatar (`border-radius: 50%`)

---

## 5. Shadow System

### 5.1 Light Mode

```css
--shadow-xs: 0 1px 2px rgba(15,23,36,0.04);   /* Cards, subtle depth */
--shadow-sm: 0 1px 3px rgba(15,23,36,0.06), 0 1px 2px rgba(15,23,36,0.04);
--shadow-md: 0 4px 8px rgba(15,23,36,0.06), 0 2px 4px rgba(15,23,36,0.04); /* Dropdowns, tooltips */
--shadow-lg: 0 12px 24px rgba(15,23,36,0.08), 0 4px 8px rgba(15,23,36,0.04); /* Modals, search panel */
--shadow-xl: 0 24px 48px rgba(15,23,36,0.12), 0 8px 16px rgba(15,23,36,0.06); /* Large modals, install prompt */
```

### 5.2 Dark Mode

```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.3);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.3);
--shadow-md: 0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3);
--shadow-lg: 0 12px 24px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3);
--shadow-xl: 0 24px 48px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.3);
```

Shadow uses `rgba(15,23,36)` in light mode (matching `--text-primary`) and `rgba(0,0,0)` in dark mode, with increasing opacity for deeper elevations.

---

## 6. Glassmorphism Tokens

The glass effect is used for login cards, case detail modals, and the sidebar backdrop.

| Token | Light Value | Dark Value |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,0.88)` | `rgba(19,28,47,0.88)` |
| `--glass-border` | `rgba(255,255,255,0.15)` | `rgba(255,255,255,0.07)` |

The `.glass-card` class uses:
```css
.glass-card {
  background: rgba(27, 40, 56, 0.75);   /* Fixed dark tint overlay */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

Modal glass variants apply:
```css
background: var(--glass-bg);
backdrop-filter: blur(24px);
border: 1px solid var(--glass-border);
```

Sidebar glass variant applies:
```css
backdrop-filter: blur(12px);
background: color-mix(in srgb, var(--surface) 88%, transparent);
```

---

## 7. Animation & Motion Tokens

### 7.1 CSS Animations

| Name | Keyframes | Duration | Easing | Usage |
|---|---|---|---|---|
| `spin` | `0% { transform: rotate(0deg) }` → `100% { transform: rotate(360deg) }` | `0.6s` | `linear` | Spinner icon |
| `shimmer` | `-200%` → `200%` background-position | `1.5s` | `infinite` | Skeleton loaders |
| `blurFadeIn` | `opacity:0; filter:blur(10px)` → `opacity:1; filter:blur(0)` | `0.6s` | `ease-out` | Page/component entrance |
| `slideUp` | `opacity:0; transform:translateY(20px)` → `opacity:1; transform:translateY(0)` | `0.4s–0.5s` | `ease-out` | List entrance, staggered children |
| `scaleIn` | `opacity:0; transform:scale(0.95)` → `opacity:1; transform:scale(1)` | `0.3s` | `ease-out` | Modal entrance |
| `marqueeScroll` | `0% { transform: translateX(0) }` → `100% { transform: translateX(-50%) }` | `30s` | `linear` | Marquee ticker |

### 7.2 CSS Transition Defaults

```css
/* Common pattern for interactive elements */
transition: background 0.15s, color 0.15s, border-color 0.15s,
            box-shadow 0.15s, transform 0.15s;
```

### 7.3 Framer Motion / `motion` Library Usage

The project uses `motion` (framer-motion v12+) for component-level animations. Standard patterns:

| Pattern | Values |
|---|---|
| **Fade + slide in** | `initial: { opacity: 0, y: 12 }` → `animate: { opacity: 1, y: 0 }`, duration `0.2–0.35s`, ease `easeOut` |
| **Scale + fade modal** | `initial: { opacity: 0, scale: 0.94, y: 20 }` → `animate: { opacity: 1, scale: 1, y: 0 }`, spring bounce `0.15` |
| **Staggered list** | Per-item `initial: { opacity: 0, x: -8 }` → `animate: { opacity: 1, x: 0 }`, `delay: i * 0.02–0.04s` |
| **Hover micro-interaction** | `whileHover={{ scale: 1.02–1.15 }}`, `whileTap={{ scale: 0.9–0.98 }}` |
| **Spring badge pop** | `initial={{ scale: 0 }}` → `animate={{ scale: 1 }}`, `type: 'spring', stiffness: 500, damping: 20` |
| **Layout animate** | `layout` prop on `motion.div` for smooth reorder |

### 7.4 Staggered Children Utility Classes

```css
.stagger-children > * { opacity: 0; animation: slideUp 0.4s ease-out both; }
/* nth-child delays from 0.05s to 0.5s for 10 children */

.stagger-enter > * { opacity: 0; animation: slideUp 0.4s ease-out both; }
/* nth-child delays from 0.03s to 0.30s for 10 children */
```

---

## 8. Component Recipes

### 8.1 Buttons

#### `.btn` (Base)
```
display: inline-flex; align-items: center; justify-content: center;
gap: var(--space-2);
padding: var(--space-2) var(--space-4);
font-size: 0.85rem; font-weight: 500; line-height: 1.4;
border-radius: var(--radius-md);
border: 1px solid transparent;
cursor: pointer;
transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
white-space: nowrap;
```

#### `.btn-sm`
```
padding: var(--space-1) var(--space-3); font-size: 0.8rem;
```

#### Variants

| Class | Background | Text | Border | Hover | Active |
|---|---|---|---|---|---|
| `.btn-primary` | `var(--primary)` | `var(--text-inverse)` | `var(--primary)` | `var(--primary-hover)` | `var(--primary-active)` |
| `.btn-accent` | `#003580` | `#fff` | none | `#002a66` | `#001f4d` + `scale(0.98)` |
| `.btn-ghost` | `transparent` | `var(--text-secondary)` | `var(--border)` | `var(--surface-hover)`, `var(--text-primary)`, `var(--border-hover)` | — |
| `.btn-danger` | `var(--danger)` | `white` | `var(--danger)` | `opacity: 0.9` | — |

**Disabled**: `opacity: 0.5; cursor: not-allowed`

#### `.btn-icon`
```
width: 36px; height: 36px; padding: 0;
border: 1px solid var(--border); border-radius: var(--radius-md);
background: var(--surface); color: var(--text-secondary);
transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.15s;
```

---

### 8.2 Forms

#### `.form-group`
```
margin-bottom: var(--space-4);
```

#### `.form-label`
```
display: block; font-size: 0.8rem; font-weight: 500;
color: var(--text-secondary); margin-bottom: var(--space-1);
```

#### `.form-input`, `.form-select`, `.form-textarea`
```
width: 100%;
padding: var(--space-2) var(--space-3);
font-size: 0.85rem; font-family: inherit;
border: 1px solid var(--border); border-radius: var(--radius-md);
background: var(--surface); color: var(--text-primary);
transition: border-color 0.15s, box-shadow 0.15s;
```

**Focus**: `border-color: var(--border-focus); box-shadow: 0 0 0 2px var(--primary-light);`

**Error**: `.form-input.error` → `border-color: var(--danger)`

#### `.form-error`
```
font-size: 0.75rem; color: var(--danger); margin-top: var(--space-1);
```

#### `.form-row`
```
display: flex; gap: var(--space-3);
> .form-group { flex: 1; }
```

#### `.filter-select`
Same as `.form-select` but with `cursor: pointer; min-width: 140px`.

#### `.form-textarea`
```
resize: vertical; min-height: 80px;
```

---

### 8.3 Cards

#### `.card`
```
background: var(--surface);
border: 1px solid var(--border); border-radius: var(--radius-lg);
padding: var(--space-5);
box-shadow: var(--shadow-xs);
```

#### `.card-header`
```
display: flex; align-items: center; justify-content: space-between;
margin-bottom: var(--space-4);
h3 { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
```

#### `.stat-card`
```
background: var(--surface); border: 1px solid var(--border);
border-radius: var(--radius-lg); padding: var(--space-4);
```

#### `.chart-card`
```
background: var(--surface); border: 1px solid var(--border);
border-radius: var(--radius-lg); padding: var(--space-4);
```

---

### 8.4 Glass Card (`.glass-card`)

```
background: rgba(27, 40, 56, 0.75);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: var(--radius-xl);
padding: var(--space-6);
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
```

**Component**: `GlassCard` wraps children in `motion.div` with entrance animation (`opacity: 0, y: 12` → `opacity: 1, y: 0`, duration 0.35s).

---

### 8.5 Badges

#### `.badge` base
```
display: inline-flex; align-items: center;
padding: 2px 8px; font-size: 0.75rem; font-weight: 500;
border-radius: 10px; white-space: nowrap;
```

#### Status Badges

| Variant | Background | Text Color | Context |
|---|---|---|---|
| `badge-open` | `var(--success-light)` | `var(--success)` | Case status is Open |
| `badge-active` | `var(--info-light)` | `var(--info)` | Case status is Active |
| `badge-pending` | `var(--warning-light)` | `var(--warning)` | Case status is Pending |
| `badge-closed` | `var(--surface-active)` | `var(--text-tertiary)` | Case status is Closed |

#### Type Badges

| Variant | Background | Text Color | Context |
|---|---|---|---|
| `badge-criminal` | `var(--danger-light)` | `var(--danger)` | Criminal case type |
| `badge-civil` | `var(--info-light)` | `var(--info)` | Civil case type |
| `badge-family` | `var(--accent-light)` | `var(--accent)` | Family case type |
| `badge-commercial` | `var(--primary-light)` | `var(--primary)` | Commercial case type |
| `badge-labour` | `var(--success-light)` | `var(--success)` | Labour case type |

#### Priority Badges

| Variant | Background | Text Color | Context |
|---|---|---|---|
| `badge-high` | `var(--danger-light)` | `var(--danger)` | High priority |
| `badge-medium` | `var(--warning-light)` | `var(--warning)` | Medium priority |
| `badge-low` | `var(--info-light)` | `var(--info)` | Low priority |

#### Role Badges

| Variant | Background | Text Color | Context |
|---|---|---|---|
| `role-badge.admin` | `var(--primary-light)` | `var(--primary)` | Admin user role |
| `role-badge.manager` | `var(--accent-light)` | `var(--accent)` | Manager user role |
| `role-badge.clerk` | `var(--info-light)` | `var(--info)` | Clerk user role |

---

### 8.6 Modals

#### `.modal-overlay`
```
position: fixed; inset: 0; z-index: 200;
background: rgba(0,0,0,0.4);
display: flex; align-items: center; justify-content: center;
padding: var(--space-5);
backdrop-filter: blur(1px);
```

#### `.modal`
```
background: var(--surface);
border-radius: var(--radius-xl); box-shadow: var(--shadow-xl);
width: 100%; max-width: 520px; max-height: 85vh;
display: flex; flex-direction: column;
```

Sizes: `.modal-sm` (max-width: 440px), `.modal-lg` (max-width: 720px).

#### `.modal-header`
```
display: flex; align-items: center; justify-content: space-between;
padding: var(--space-4) var(--space-5);
border-bottom: 1px solid var(--border);
h3 { font-size: 1rem; font-weight: 600; }
```

#### `.modal-body`
```
padding: var(--space-4) var(--space-5); overflow-y: auto; flex: 1;
```

#### `.modal-footer`
```
display: flex; align-items: center; justify-content: space-between;
padding: var(--space-3) var(--space-5);
border-top: 1px solid var(--border); flex-shrink: 0;
```

---

### 8.7 Tables

#### `.table`
```
width: 100%; border-collapse: collapse; font-size: 0.85rem;
```

#### Table headers (th)
```
text-align: left; padding: var(--space-2) var(--space-3);
font-weight: 600; font-size: 0.78rem; color: var(--text-tertiary);
text-transform: uppercase; letter-spacing: 0.04em;
border-bottom: 2px solid var(--border);
background: var(--surface); white-space: nowrap;
```

#### Table cells (td)
```
padding: var(--space-2) var(--space-3);
border-bottom: 1px solid var(--border); vertical-align: middle;
```

**Row hover**: `tr:hover td { background: var(--surface-hover); }`

#### `.table-container`
```
overflow-x: auto;
```

---

### 8.8 Sidebar

#### Structure
```
.sidebar              — 220px fixed-height, sticky panel
  .sidebar-header     — Brand/logo area with border-bottom
  .sidebar-nav        — Scrollable navigation region
    .sidebar-section  — Group of related links
    .sidebar-label    — Uppercase section header
    .nav-link         — Individual navigation item
  .sidebar-footer     — User info, avatar, theme toggle
```

#### `.sidebar`
```
width: 220px; flex-shrink: 0; background: var(--surface);
border-right: 1px solid var(--border);
display: flex; flex-direction: column; height: 100vh;
position: sticky; top: 0; overflow-y: auto;
```

#### `.nav-link`
```
display: flex; align-items: center; gap: var(--space-3);
width: 100%; padding: var(--space-2) var(--space-4);
background: none; border: none;
color: var(--text-secondary); font-size: 0.85rem;
cursor: pointer; transition: background 0.15s, color 0.15s;
text-align: left; position: relative;
```

States:
- Default: `color: var(--text-secondary)`
- Hover: `background: var(--surface-hover); color: var(--text-primary)`
- Active: `background: var(--primary-light); color: var(--primary); font-weight: 500`
- Active indicator: `box-shadow: inset 3px 0 0 var(--primary)`

#### Mobile behavior:
- Sidebar slides in from left as fixed overlay (`left: -280px` → `left: 0`)
- Backdrop overlay with `backdrop-filter: blur(4px)`
- Transitions with `cubic-bezier(0.4, 0, 0.2, 1)` for 0.3s

---

### 8.9 Topbar

#### `.topbar`
```
display: flex; align-items: center;
padding: var(--space-3) var(--space-5);
background: var(--surface); border-bottom: 1px solid var(--border);
gap: var(--space-4); position: sticky; top: 0; z-index: 50;
```

Sections: `.topbar-left`, `.topbar-center` (search), `.topbar-right` (actions, notifications, date).

---

### 8.10 Dashboard

#### `.stats-grid`
```
display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: var(--space-4); margin-bottom: var(--space-5);
```

#### `.charts-grid`
```
display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
```

#### `.vis-grid`
```
display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
gap: var(--space-4);
```

---

### 8.11 Search Bar

#### `.search-bar-input`
```
width: 100%; padding: var(--space-1) var(--space-3) var(--space-1) 30px;
font-size: 0.82rem; font-family: inherit;
border: 1px solid var(--border); border-radius: 20px;
background: var(--surface-active); color: var(--text-primary);
transition: all 0.15s;
```

**Focus**: `border-color: var(--primary); background: var(--surface); box-shadow: 0 0 0 2px var(--primary-light)`

#### `.search-panel` (Dropdown)
```
position: absolute; top: calc(100% + 4px); left: 0; right: 0;
background: var(--surface-raised); border: 1px solid var(--border);
border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
max-height: 420px; overflow-y: auto; z-index: 100;
```

States: `.search-panel-loading`, `.search-panel-error`, `.search-panel-empty`.

---

### 8.12 Notification Bell

#### `.notif-bell`
```
position: relative; width: 32px; height: 32px;
display: flex; align-items: center; justify-content: center;
background: none; border: none; border-radius: var(--radius-sm);
cursor: pointer; color: var(--text-tertiary);
transition: color 0.15s, background 0.15s;
```
States: `has-unread` → `color: var(--primary)`.

#### `.notif-panel`
```
position: absolute; top: calc(100% + 6px); right: -8px;
width: 360px; max-height: 460px;
background: var(--surface-raised); border: 1px solid var(--border);
border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);
z-index: 150;
```

---

### 8.13 Loading States

#### `.spinner`
```
width: 24px; height: 24px; border: 2px solid var(--border);
border-top-color: var(--primary); border-radius: 50%;
animation: spin 0.6s linear infinite;
```
Size variant: `.spinner-sm` (16px).

#### `.skeleton`
```
background: linear-gradient(90deg, var(--surface) 25%, var(--surface-hover) 50%, var(--surface) 75%);
background-size: 200% 100%; animation: shimmer 1.5s infinite;
border-radius: var(--radius-sm);
```

#### `.loading-screen`, `.loading-page`
```
display: flex; flex-direction: column; align-items: center;
justify-content: center; min-height: 60vh; color: var(--text-tertiary);
```

---

### 8.14 Empty & Error States

#### `.empty-state`
```
text-align: center; padding: var(--space-10) var(--space-5);
color: var(--text-tertiary);
h3 { font-size: 1rem; font-weight: 600; color: var(--text-secondary); margin: var(--space-3) 0 var(--space-1); }
p { font-size: 0.85rem; }
```

#### `.error-state`
```
text-align: center; padding: var(--space-8) var(--space-5);
h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1); }
p { font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: var(--space-3); }
```

---

### 8.15 Toast Notifications

#### `.toast-container`
```
position: fixed; top: var(--space-4); right: var(--space-4); z-index: 10000;
display: flex; flex-direction: column; gap: var(--space-2); max-width: 380px;
pointer-events: none;
```

#### `.toast`
```
display: flex; align-items: center; gap: var(--space-3);
padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
background: var(--surface); box-shadow: 0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08);
border: 1px solid var(--border); pointer-events: auto;
backdrop-filter: blur(12px);
```

Variants: `.toast-success` (left border `--success`), `.toast-error` (left border `--danger`), `.toast-info` (left border `--info`).

---

### 8.16 Calendar

#### Grid layout
```css
.calendar-grid { grid-template-columns: repeat(7, 1fr); }
.calendar-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); }
.calendar-week { display: grid; grid-template-columns: repeat(7, 1fr); }
```

#### `.calendar-cell`
```
min-height: 100px; padding: var(--space-1); border-right: 1px solid var(--border);
cursor: pointer; display: flex; flex-direction: column; gap: 2px;
```

States: `.other-month` (opacity 0.4, pointer-events: none), `.today` (background: `var(--primary-light)`).

---

### 8.17 Visualisation Cards

#### `.vis-card`
```
background: var(--surface); border: 1px solid var(--border);
border-radius: var(--radius-lg); overflow: hidden;
transition: box-shadow 0.15s, border-color 0.15s;
```

Hover: `box-shadow: var(--shadow-md); border-color: var(--border-hover)`

#### `.vis-card-header`
```
display: flex; align-items: center; justify-content: space-between;
padding: var(--space-3) var(--space-4);
border-bottom: 1px solid var(--border);
```

---

### 8.18 Pagination

#### `.pagination`
```
display: flex; align-items: center; justify-content: space-between;
padding: var(--space-3) 0; font-size: 0.82rem; color: var(--text-secondary);
```

#### `.pagination-btn`
```
padding: var(--space-1) var(--space-2);
background: none; border: 1px solid var(--border);
border-radius: var(--radius-sm); cursor: pointer;
font-size: 0.8rem; color: var(--text-secondary);
```

Active state: `background: var(--primary); color: var(--text-inverse); border-color: var(--primary)`

---

### 8.19 PWA Install Prompt

#### `.install-prompt`
```
position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
z-index: 1000; display: flex; align-items: center; gap: var(--space-3);
padding: var(--space-3) var(--space-4);
background: var(--surface); border: 1px solid var(--border);
border-radius: var(--radius-lg); box-shadow: var(--shadow-xl);
max-width: 420px;
```

---

### 8.20 Offline Indicator

#### `.offline-indicator`
```
position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
display: flex; align-items: center; justify-content: center;
gap: var(--space-2); padding: 6px 16px;
background: var(--danger); color: #fff; font-size: 0.78rem; font-weight: 500;
```

---

## 9. Theme Architecture

### 9.1 Theme Modes

The system supports three modes:
1. **Light** (`data-theme="light"` or default `:root`)
2. **Dark** (`data-theme="dark"`)
3. **System** (no attribute set on `<html>`, uses `prefers-color-scheme` media query)

### 9.2 CSS Variable Cascade

```
:root                                    → Light theme default
[data-theme="light"]                     → Explicit light (same as :root)
[data-theme="dark"]                      → Dark theme values
@media (prefers-color-scheme: dark)      → System dark (when no theme attr set)
  :root:not([data-theme]):not([data-theme]) → System dark fallback
```

### 9.3 Theme Toggle

The sidebar's theme toggle cycles through three options:
- **Light** (sun icon) → sets `data-theme="light"`
- **System** (monitor icon) → removes the attribute → falls back to `prefers-color-scheme`
- **Dark** (moon icon) → sets `data-theme="dark"`

### 9.4 Dark Mode Image Handling

```css
[data-theme="dark"] img,
[data-theme="dark"] svg:not(.no-theme) {
  opacity: 0.9;
}
```

---

## 10. Responsive Breakpoints

| Breakpoint | Media Query | Changes |
|---|---|---|
| Desktop | `> 1024px` | Full layout, sidebar visible, 2-column charts |
| Tablet | `<= 1024px` | Sidebar narrows to 180px, charts→1 column, detail grid→1 column |
| Mobile | `<= 768px` | Sidebar becomes overlay with hamburger, stacked forms, compact spacing |
| Small mobile | `<= 480px` | Single column stats, compact topbar, full-width modals |

### Key Responsive Behaviors

- **Sidebar**: Hidden off-screen (`left: -280px`), slides in with overlay backdrop. Hamburger button shown in topbar.
- **Topbar**: Center search narrows, date/hidden on mobile. Compact padding.
- **Page content**: Padding reduces from `--space-5` to `--space-3` to `--space-2`.
- **Forms**: `.form-row` stacks vertically at 768px.
- **Modals**: Full-width at 768px (max-width 100%), tighter padding at 480px.
- **Tables**: Horizontal scroll wrapper with negative margins on mobile.
- **Stats grid**: 2-column at 768px, single column at 480px.
- **Pagination**: Wraps and centers on mobile.
- **Calendar cells**: Shrink from 100px to 60px min-height.
- **Dashboard header row**: Stacks vertically on mobile.

---
