# MOJ Case Tracker — Component Library

**Ministry of Justice, Republic of Namibia**

> Complete reference for every reusable component in the frontend. Each component documents its purpose, props, states (loading, empty, error, edge cases), and dependencies.

---

## Table of Contents

1. [GlassCard](#glasscard)
2. [Logo](#logo)
3. [Sidebar](#sidebar)
4. [SearchBar](#searchbar)
5. [NotificationBell](#notificationbell)
6. [DocumentPanel](#documentpanel)
7. [InstallPrompt](#installprompt)
8. [OfflineIndicator](#offlineindicator)
9. [VisCard](#viscard)
10. [VisBuilder](#visbuilder)
11. [PlaylistPanel](#playlistpanel)
12. [CaseModal](#casemodal)
13. [CaseDetailModal](#casedetailmodal)
14. [ChartRenderer](#chartrenderer)
15. [ChartEmpty](#chartempty)
16. [ChartError](#charterror)
17. [ChartSkeleton](#chartskeleton)
18. [ChartRegistry](#chartregistry)

---

## GlassCard

**File**: `GlassCard.js`

### Purpose

A frosted-glass container wrapper with a fade-in animation. Used for login cards and elevated content panels. Wraps children in a `motion.div` with a blur backdrop and dark semi-transparent background overlay.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Content to render inside the glass card |
| `className` | `string` | `''` | Additional CSS classes appended to `glass-card` |
| `style` | `object` | `{}` | Inline styles merged into the container |

### Dependencies

- `motion` (framer-motion v12+)
- CSS classes: `.glass-card` (defined in `index.css`)

### States

| State | Behavior |
|---|---|
| **Default** | Renders children with `backdrop-filter: blur(16px)`, dark overlay background, white border, `--radius-xl` corners, and `--space-6` padding |
| **Empty children** | Renders an empty `motion.div` — no visible content |
| **Custom class** | `className` is appended to the base `glass-card` class, allowing overrides |
| **Custom style** | `style` object is spread onto the container, overriding CSS defaults |

### Animation

```jsx
initial = {{ opacity: 0, y: 12 }}
animate = {{ opacity: 1, y: 0 }}
transition = {{ duration: 0.35, ease: 'easeOut' }}
```

---

## Logo

**File**: `Logo.js`

### Purpose

Renders the Ministry of Justice branding: the Namibia Coat of Arms (SVG) alongside the ministry and republic name text. Adapts layout and sizing based on a `variant` prop.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'sidebar'` \| `'login'` \| `'icon-only'` | `'sidebar'` | Layout variant. `sidebar` = horizontal row, `login` = vertical stack, `icon-only` = crest only |
| `className` | `string` | `''` | Additional CSS class appended to the logo container |

### Behavior by Variant

| Variant | Layout | Crest Size | Text |
|---|---|---|---|
| `sidebar` | Horizontal flex row | 32x32 | Ministry top, Republic below |
| `login` | Vertical column | 56x56 | Larger text, centered alignment |
| `icon-only` | Single element | 32x32 | Hidden (returns null for text block) |

### Dependencies

- SVG asset: `${process.env.PUBLIC_URL}/images/namibia-coat-of-arms.svg`
- CSS classes: `.moj-logo`, `.moj-logo-{variant}`, `.moj-logo-crest`, `.moj-logo-text`, `.moj-logo-ministry`, `.moj-logo-republic`

### Edge Cases

| Scenario | Behavior |
|---|---|
| `variant` is not sidebar/login/icon-only | Renders with class `moj-logo-{unknown}` — layout may break |
| SVG image fails to load | Browser shows broken image icon (no error boundary) |
| `variant="icon-only"` | Text block is not rendered, only the crest image |

---

## Sidebar

**File**: `Sidebar.js`

### Purpose

Application sidebar navigation with role-based links, user avatar, and a three-way theme toggle (light/system/dark). Integrates with `AuthContext` for user info and `ThemeContext` for theme control.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `page` | `string` | — | Current active page name (e.g. `'dashboard'`, `'cases'`) |
| `setPage` | `(page: string) => void` | — | Callback to navigate to a page |
| `totalCases` | `number` | — | Total case count (shown as badge on Cases nav link) |
| `isOpen` | `boolean` | — | Mobile overlay visibility state |
| `onClose` | `() => void` | — | Callback to close mobile sidebar overlay |

### Dependencies

- `motion` / `AnimatePresence`
- `AuthContext` (`user`, `logout`)
- `ThemeContext` (`theme`, `setTheme`)
- `Logo` component
- CSS classes: `.sidebar`, `.sidebar-header`, `.sidebar-brand`, `.sidebar-nav`, `.sidebar-section`, `.sidebar-label`, `.nav-link`, `.nav-badge`, `.sidebar-footer`, `.sidebar-user`, `.sidebar-avatar`, `.sidebar-user-info`, `.sidebar-overlay`, `.sidebar-mobile-close`, `.theme-toggle`, `.theme-option`

### Navigation Items

| Item | Icon | Visibility | Action |
|---|---|---|---|
| Dashboard | 4-square grid | Always | `setPage('dashboard')` |
| Cases | File document | Always | `setPage('cases')` + badge count |
| Visualisations | Bar chart | Admin only | `setPage('visualisations')` |
| Calendar | Calendar icon | Admin only | `setPage('calendar')` |
| Reports | Upload icon | Admin only | `setPage('reports')` |
| Users | People icon | Admin only | `setPage('users')` |
| Shortcuts | Terminal icon | Always | Dispatches `key:shortcuts` custom event |
| Sign Out | Logout icon | Always | Calls `logout()` from AuthContext |

### States

| State | Behavior |
|---|---|
| **Desktop** | Fixed 220px sidebar, sticky, full height |
| **Mobile (isOpen=true)** | Slides in from left `(-280px → 0)` with overlay backdrop |
| **Mobile (isOpen=false)** | Hidden off-screen |
| **Loading (null user)** | Avatar shows "?", name shows "User", role empty |
| **Admin user** | All nav items visible |
| **Non-admin user** | Visualisations, Calendar, Reports, Users hidden (conditionally rendered) |

### Theme Toggle

Cycles through three options: `light` → `dark` → `system`. Rendered as radio group with sun, monitor, and moon icons. Active option highlighted with `box-shadow: var(--shadow-xs)`.

### Animations

- Sidebar entrance: `opacity: 0, x: -16` → `opacity: 1, x: 0` (0.25s)
- Nav links: `whileHover={{ x: 3 }}`, `whileTap={{ scale: 0.97 }}`
- Active nav: `boxShadow: 'inset 3px 0 0 var(--primary)'`
- Overlay: `opacity: 0` → `opacity: 1` with `backdrop-filter: blur(4px)`

---

## SearchBar

**File**: `SearchBar.js`

### Purpose

Global search bar with debounced API query, keyboard shortcuts, and a dropdown results panel. Searches cases, documents, and activity logs simultaneously.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `navigateTo` | `(page: string) => void` | — | Function to navigate to a page (e.g. `'cases'`) |

### Internal State

| State | Values | Description |
|---|---|---|
| `query` | `string` | Raw input value |
| `debounced` | `string` | 250ms debounced query sent to API |
| `results` | `{ cases, documents, logs }` | Search results from API |
| `loading` | `boolean` | API request in-flight |
| `error` | `string` | Error message from failed search |
| `focused` | `boolean` | Whether search is active |
| `selectedIndex` | `number` | Keyboard-navigated result index (-1 = none) |

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+K` / `Cmd+K` | Focus and select all text in search input |
| `/` (anywhere except input) | Focus search input |
| `Escape` | Blur search input |
| `ArrowDown` | Move selection down |
| `ArrowUp` | Move selection up |
| `Enter` | Select highlighted result |

### States

| State | UI |
|---|---|
| **Empty input** | Placeholder text "Search cases, documents..." |
| **Typing (< 1 char)** | No panel shown |
| **Loading** | Spinner + "Searching..." message |
| **Error** | Red error text "Search failed." |
| **No results** | Search icon + "No results for {query}" + hint text |
| **Results** | Grouped sections (Cases, Documents, Activity Logs) with highlighted matches |
| **Keyboard selected** | `search-result-item.selected` class for highlighted item |

### Dependencies

- `axios`
- `motion` / `AnimatePresence`
- API endpoint: `GET /api/search?q={query}&limit=10`
- CSS classes: `.search-bar-container`, `.search-bar-wrapper`, `.search-bar-icon`, `.search-bar-input`, `.search-bar-clear`, `.search-panel`, `.search-panel-loading`, `.search-panel-error`, `.search-panel-empty`, `.search-results`, `.search-group`, `.search-group-label`, `.search-result-item`, `.search-result-primary`, `.search-result-secondary`
- Custom events: `case:select` dispatched with `{ caseId, tab? }`

### Edge Cases

| Scenario | Behavior |
|---|---|
| Very long query | Sent as-is to API; truncated in display with `text-overflow: ellipsis` |
| API returns null | Handled — sets empty results |
| Rapid typing | Debounced to 250ms, previous request cancelled via `cancelled` flag |
| Click outside | Panel closes via `mousedown` listener on document |
| Select with no results | `Enter` key does nothing when no items present |
| Result highlight (HTML) | Uses `dangerouslySetInnerHTML` for `_hl` fields — ensure API sanitizes |

---

## NotificationBell

**File**: `NotificationBell.js`

### Purpose

Bell icon with unread count badge and a dropdown notification panel. Polls for new notification count every 45 seconds and fetches full list when panel opens.

### Props

None (autonomous component, reads auth from context).

### Internal State

| State | Type | Description |
|---|---|---|
| `notifications` | `Array` | Full list of notifications |
| `unread` | `number` | Unread count (capped display: "99+") |
| `open` | `boolean` | Panel visibility |
| `loading` | `boolean` | Fetching notifications |

### States

| State | UI |
|---|---|
| **No user** | Returns `null` (hidden entirely) |
| **No unread** | Bell icon with default color |
| **Unread count > 0** | Bell icon with `has-unread` class + animated badge with count |
| **Loading panel** | Spinner in panel body |
| **Empty notifications** | Bell icon + "No notifications yet" message |
| **Has notifications** | List with icons, titles, messages, timestamps, unread dots |
| **Panel open + new notification arrives** | Count not updated until next panel open |

### Notification Type Icons

| Type | Icon | Color Mapping |
|---|---|---|
| `info` | Info circle | `info-light` bg, `info` text, `info` dot |
| `success` | Checkmark | `success-light` bg, `success` text, `success` dot |
| `warning` | Triangle alert | `warning-light` bg, `warning` text, `warning` dot |
| `danger` | X-circle | `danger-light` bg, `danger` text, `danger` dot |

### Dependencies

- `axios`
- `motion` / `AnimatePresence`
- `AuthContext`
- API endpoints: `GET /api/notifications?limit=15`, `GET /api/notifications/unread-count`, `PUT /api/notifications/{id}/read`, `PUT /api/notifications/read-all`
- CSS classes: `.notif-bell-container`, `.notif-bell`, `.notif-badge`, `.notif-panel`, `.notif-panel-header`, `.notif-panel-body`, `.notif-loading`, `.notif-empty`, `.notif-item`, `.notif-icon`, `.notif-content`, `.notif-title`, `.notif-message`, `.notif-time`, `.notif-unread-dot`

### Edge Cases

| Scenario | Behavior |
|---|---|
| API fails (fetch) | Silently ignored; notifications remain empty |
| API fails (mark read) | Silently ignored; badge may stay |
| 99+ unread | Badge shows "99+" |
| Notification panel open + polling | Polling skipped (`open` check) |
| Outside click | Panel closes |

---

## DocumentPanel

**File**: `DocumentPanel.js`

### Purpose

Displays documents attached to a case. Supports upload, download, and delete operations. Shows skeleton loading and empty states.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `caseId` | `number\|string` | — | Case ID to fetch documents for |

### Internal State

| State | Type | Description |
|---|---|---|
| `documents` | `Array` | Document objects from API |
| `loading` | `boolean` | Fetching documents |
| `uploading` | `boolean` | File upload in progress |

### States

| State | UI |
|---|---|
| **Loading** | 2 skeleton bars mimicking document items |
| **Empty** | "No documents attached." message |
| **Has documents** | List with icons, names, sizes, uploader, actions |
| **Uploading** | Button shows "Uploading..." and is disabled |
| **Upload error** | Toast error via `ToastContext` |
| **Download** | Triggers browser download via blob URL |
| **Delete** | Confirmation dialog, then delete, then toast |

### Document Type Icons

| MIME Type | Icon |
|---|---|
| PDF | 📄 |
| Image | 🖼️ |
| Word/DOC | 📝 |
| Excel/XLS | 📊 |
| Other | 📎 |

### Dependencies

- `axios`
- `motion` / `AnimatePresence`
- `ToastContext` (`success`, `error`)
- API endpoints: `GET /api/cases/{caseId}/documents`, `POST /api/cases/{caseId}/documents`, `GET /api/documents/{id}/download`, `DELETE /api/documents/{id}`
- CSS classes: `.document-panel`, `.document-upload-area`, `.document-list`, `.document-item`, `.document-icon`, `.document-info`, `.document-name`, `.document-meta`, `.document-actions`

### Edge Cases

| Scenario | Behavior |
|---|---|
| `caseId` is null/undefined | `fetchDocuments` not called; empty state shown |
| Upload with no file selected | Returns early (no-op) |
| File > max size | Server returns 413; error handled as toast |
| Download blob fails | Toast error; no retry |
| Delete cancelled | Confirmation returns early |
| Long filenames | Truncated with `text-overflow: ellipsis` |

---

## InstallPrompt

**File**: `InstallPrompt.js`

### Purpose

PWA install banner that appears 5 seconds after the `beforeinstallprompt` event fires. Allows users to install the app as a standalone application.

### Props

None (autonomous component).

### Internal State

| State | Type | Description |
|---|---|---|
| `deferredPrompt` | `Event` | The stored `beforeinstallprompt` event |
| `show` | `boolean` | Whether the prompt is visible |
| `dismissed` | `boolean` | Whether the user dismissed the prompt |

### States

| State | UI |
|---|---|
| **Not installable** | Hidden (no `beforeinstallprompt` event) |
| **Already installed (standalone)** | Hidden |
| **Prompt ready, waiting 5s** | Hidden |
| **Prompt visible** | Bottom-center banner with install button |
| **Dismissed** | Hidden; `dismissed` flag prevents future show |
| **Installed** | Hidden after `accepted` outcome |

### Dependencies

- `motion` / `AnimatePresence`
- CSS classes: `.install-prompt`, `.install-prompt-icon`, `.install-prompt-text`, `.install-prompt-actions`

### Edge Cases

| Scenario | Behavior |
|---|---|
| `beforeinstallprompt` never fires | Component never shows |
| User in standalone mode | `display-mode: standalone` check hides prompt |
| User dismisses, then refreshes | `dismissed` state resets; prompt shows again after 5s |
| User installs from browser menu | Prompt disappears (no event to detect) |

---

## OfflineIndicator

**File**: `OfflineIndicator.js`

### Purpose

Top-fixed banner that appears when the browser goes offline and disappears when connectivity is restored.

### Props

None (autonomous component).

### Internal State

| State | Type | Description |
|---|---|---|
| `offline` | `boolean` | Current online status |

### States

| State | UI |
|---|---|
| **Online** | Hidden |
| **Offline** | Red banner at top: "No internet connection — some features may be unavailable" |

### Dependencies

- `motion` / `AnimatePresence`
- Browser events: `window.addEventListener('offline'/'online')`
- CSS classes: `.offline-indicator`

### Edge Cases

| Scenario | Behavior |
|---|---|
| Initial load while offline | `!navigator.onLine` sets initial state correctly |
| Flickering connectivity | Animations via `AnimatePresence` handle seamless transitions |
| Offline after online | Banner slides down with animation |

---

## VisCard

**File**: `VisCard.js`

### Purpose

Card component in the Visualisations grid that displays a chart preview, metadata, and action controls (edit, duplicate, enable/disable, delete, favourite).

### Props

| Prop | Type | Description |
|---|---|---|
| `vis` | `object` | Visualisation object: `{ id, name, chart_type, enabled, data_source, category, is_favourite, config, refresh_interval }` |
| `onEdit` | `(vis) => void` | Edit callback |
| `onDuplicate` | `(id) => void` | Duplicate callback |
| `onDelete` | `(vis) => void` | Delete callback |
| `onToggle` | `(id, enabled) => void` | Enable/disable toggle |
| `onFavourite` | `(id, isFav) => void` | Favourite toggle |
| `dragHandleProps` | `object` | Passed to drag handle for reorder |

### States

| State | UI |
|---|---|
| **Loading data** | ChartRenderer shows nothing until data arrives |
| **Data loaded** | Chart renders via `ChartRenderer` |
| **Data error** | "Failed to load" message |
| **Disabled vis** | 55% opacity, "Disabled" placeholder, no data fetch |
| **Favourite** | Yellow star icon |
| **Not favourite** | Grey star icon |
| **Mouse enter** | Action buttons fade in |
| **Mouse leave** | Action buttons fade out |

### Dependencies

- `axios`
- `motion`
- `ChartRenderer`
- `CHART_TYPES`, `CHART_ICONS` from `ChartRegistry`
- API: `GET /api/visualisations/{id}/data`
- CSS classes: `.vis-card`, `.vis-card-disabled`, `.vis-card-drag`, `.vis-card-header`, `.vis-card-title`, `.vis-card-fav`, `.vis-card-preview`, `.vis-card-actions`, `.vis-card-delete`, `.vis-card-footer`, `.vis-card-source`, `.vis-card-refresh`

### Animations

- Entrance: `opacity: 0, y: 12` → `opacity: 1, y: 0` (0.2s)
- Exit: `opacity: 0, scale: 0.95` (0.2s)
- Actions: `opacity: 0→1, y: 4→0` (0.15s)
- Layout: `layout` prop for smooth reorder

---

## VisBuilder

**File**: `VisBuilder.js`

### Purpose

Multi-tab modal form for creating or editing visualisations. Contains six configuration tabs: General, Chart Type, Data Source, Appearance, Filters, Display.

### Props

| Prop | Type | Description |
|---|---|---|
| `existing` | `object` | Existing vis object for edit mode; `null`/`undefined` for create mode |
| `onClose` | `() => void` | Close modal callback |
| `onSaved` | `(form) => void` | Submit callback with form data |

### Internal State

| State | Type | Description |
|---|---|---|
| `form` | `object` | Full form state with all fields |
| `activeTab` | `string` | Active tab key: `general`, `chartType`, `dataSource`, `appearance`, `filters`, `display` |
| `errors` | `object` | Validation errors keyed by field name |

### Default Form Values

```js
{
  name: '', description: '', category: '', tags: '',
  chart_type: 'bar', data_source: 'cases/byType',
  colour_theme: 'default', chart_size: 'medium',
  animation_enabled: true, auto_refresh: false,
  refresh_interval: 0, fullscreen_support: true,
  config: {}, filters: [],
}
```

### Validation

| Field | Rule |
|---|---|
| `name` | Required (non-empty) |
| `chart_type` | Required |

### Tabs

| Tab | Fields |
|---|---|
| **General** | Name, Description, Category, Tags |
| **Chart Type** | Grid of chart type options from `CHART_TYPES` |
| **Data Source** | Radio list from `DATA_SOURCES` |
| **Appearance** | Colour Theme (5 options), Chart Size, Animation toggle |
| **Filters** | Dynamic filter rows (type + value) |
| **Display** | Auto-refresh toggle + interval, Fullscreen toggle |

### Dependencies

- `motion` / `AnimatePresence`
- `CHART_TYPES`, `CATEGORIES`, `DATA_SOURCES`, `CHART_SIZES`, `COLOUR_THEMES`, `CHART_ICONS` from `ChartRegistry`
- CSS classes: `.modal-overlay`, `.modal`, `.modal-lg`, `.modal-header`, `.modal-close`, `.modal-footer`, `.builder-layout`, `.builder-tabs`, `.builder-tab`, `.builder-content`, `.chart-type-grid`, `.chart-type-option`, `.chart-type-icon`, `.chart-type-label`, `.chart-type-badge`, `.data-source-list`, `.data-source-option`, `.colour-theme-grid`, `.chart-size-grid`, `.form-row`, `.form-group`, `.form-label`, `.form-input`, `.form-input-error`, `.form-error`, `.form-checkbox`

### States

| State | Behavior |
|---|---|
| **Create mode** | Title: "New Visualisation", submit: "Create Visualisation" |
| **Edit mode** | Title: "Edit Visualisation", form pre-filled from `existing`, submit: "Save Changes" |
| **Validation error** | Error message shown under invalid fields, first invalid tab remains active |
| **Close via overlay** | Click on modal-overlay (but not modal content) triggers `onClose` |

### Edge Cases

| Scenario | Behavior |
|---|---|
| No `existing` passed | Creates empty form via `DEFAULT_FORM` |
| Category "All" in filter | Has `key: ''` — renders as "No category" in select |
| Tab switch with unsaved data | Data preserved in state; no warning |

---

## PlaylistPanel

**File**: `PlaylistPanel.js`

### Purpose

Slide-over panel for managing visualisation playlists (slideshow sequences). Supports create, delete playlist, add/remove items, and adjust per-item duration.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `visualisations` | `Array` | `[]` | Available visualisations to add to playlists |
| `onClose` | `() => void` | — | Close panel callback |
| `onRefresh` | `() => void` | — | Refresh parent data callback |

### States

| State | UI |
|---|---|
| **Loading** | 2 skeleton bars |
| **Empty (no playlists)** | "No playlists yet." message |
| **Has playlists** | Accordion list with items and controls |
| **Creating** | Button disabled if name is empty |

### Dependencies

- `axios`
- `motion`
- `ToastContext` (`success`, `error`)
- API endpoints: `GET /api/playlists?limit=50`, `POST /api/playlists`, `PUT /api/playlists/{id}`, `DELETE /api/playlists/{id}`
- CSS classes: `.playlist-panel`, `.playlist-list`, `.playlist-item`, `.playlist-header`, `.playlist-item-group`

### Edge Cases

| Scenario | Behavior |
|---|---|
| Delete playlist | Confirmation dialog |
| Add item without selecting | Select's default empty option prevents submission |
| Empty playlist name | Create button disabled |

---

## CaseModal

**File**: `CaseModal.js`

### Purpose

Form modal for creating or editing a case. Contains four sections: Basic Information, Parties, Court Details, and Notes.

### Props

| Prop | Type | Description |
|---|---|---|
| `onClose` | `() => void` | Close modal callback |
| `onSaved` | `() => void` | Success callback after save |
| `existing` | `object` | Existing case data for edit mode; `null`/`undefined` for create |

### Form Structure

```js
// Default empty form
{
  title: '', case_type: 'Criminal', status: 'Open', priority: 'Medium',
  plaintiff: '', defendant: '', presiding_officer: '',
  hearing_date: '', next_action: '', description: '',
}
```

### Enums

| Field | Options |
|---|---|
| `case_type` | Criminal, Civil, Family, Commercial, Labour |
| `status` | Open, Active, Pending, Closed |
| `priority` | Low, Medium, High |

### Internal State

| State | Type | Description |
|---|---|---|
| `form` | `object` | Form data |
| `saving` | `boolean` | API request in-flight |
| `error` | `string` | Error message from server |
| `fieldErrors` | `object` | Per-field validation errors |

### Validation

| Field | Rule |
|---|---|
| `title` | Required |
| `plaintiff` | Required |
| `defendant` | Required |

### States

| State | UI |
|---|---|
| **Create mode** | Title "Open New Case", submit "Open Case" |
| **Edit mode** | Title "Edit Case", form pre-filled, submit "Save Changes" |
| **Saving** | Spinner in button, button disabled, opacity 0.6 |
| **Server error** | Red error banner at top of form |
| **Field error** | Red border on field + error text below |
| **Glass modal backdrop** | `backdrop-filter: blur(6px)` on overlay, `blur(24px)` on modal itself with `--glass-bg` |

### Keyboard Behavior

| Key | Action |
|---|---|
| `Escape` | Closes modal |
| `Tab` | Focus trapping within modal elements |
| `Shift+Tab` | Reverse focus trapping |

### Dependencies

- `axios`
- `motion`
- API endpoints: `POST /api/cases`, `PUT /api/cases/{id}`
- CSS classes: `.modal-overlay`, `.modal`, `.modal-header`, `.modal-close`, `.modal-body`, `.modal-footer`, `.btn`, `.btn-ghost`, `.btn-accent`
- Inline styles used extensively (no dedicated CSS classes for form sections)

### Edge Cases

| Scenario | Behavior |
|---|---|
| API returns error | `error` state shows red banner with `err.response?.data?.error` |
| Field touched then error cleared | Error cleared via `set()` helper |
| Tab focus at first element | Shift+Tab wraps to last |
| Tab focus at last element | Tab wraps to first |

---

## CaseDetailModal

**File**: `CaseDetailModal.js`

### Purpose

Detail modal for viewing a case's full information, audit log timeline, and documents. Supports two tabs: Details and Documents.

### Props

| Prop | Type | Description |
|---|---|---|
| `caseData` | `object` | Case object with at least `id` and `case_number` |
| `onClose` | `() => void` | Close callback |
| `onUpdated` | `() => void` | Refresh parent data callback |

### Internal State

| State | Type | Description |
|---|---|---|
| `detail` | `object` | Full case data from API |
| `loading` | `boolean` | Fetching case details |
| `note` | `string` | Add-note textarea value |
| `addingNote` | `boolean` | Note submission in-flight |
| `editing` | `boolean` | Show CaseModal for edit |
| `error` | `string` | Error message |
| `tab` | `'details'` \| `'documents'` | Active tab |

### Sub-components

| Component | Purpose |
|---|---|
| `StatusBadge` | Inline colour-coded status pill with dot |
| `DetailRow` | Key-value row pair for detail sections |

### States

| State | UI |
|---|---|
| **Loading** | Centered spinner + "Loading case details..." |
| **Error** | Error icon + message + "Try Again" button |
| **No data (null detail)** | "No data found." centered text |
| **Loaded — Details tab** | Case number, status badge, title, metadata grid, parties, audit log timeline, add-note form |
| **Loaded — Documents tab** | Renders `DocumentPanel` component |
| **Editing** | Replaces content with `CaseModal` for edit flow |

### Details Tab Layout

Left column (2/3):
- Case Information card: type, priority, status, hearing date, next action, description
- Parties card: plaintiff, defendant, presiding officer, filed date

Right column (1/3):
- Audit Log: Timeline with dots, vertical connecting line, action/note/meta
- Add Note Form: textarea + submit button

### Dependencies

- `axios`
- `motion` / `AnimatePresence`
- `CaseModal`
- `DocumentPanel`
- `ToastContext` (`success`, `error`)
- API endpoints: `GET /api/cases/{id}`, `POST /api/cases/{id}/logs`
- CSS classes: `.modal-overlay`, `.modal`, `.modal-lg`, `.modal-header`, `.modal-close`, `.modal-body`, `.modal-footer`, `.case-number`

### Status Badge Color Map

| Status | Color | Background |
|---|---|---|
| Open | `var(--success)` | `var(--success-light)` |
| Active | `var(--info)` | `var(--info-light)` |
| Pending | `var(--warning)` | `var(--warning-light)` |
| Closed | `var(--text-tertiary)` | `var(--surface-active)` |

### Edge Cases

| Scenario | Behavior |
|---|---|
| Case with no logs | "No audit records yet." |
| Case with no documents | DocumentPanel shows "No documents attached." |
| Note submission fails | Toast error, note preserved in textarea |
| Empty note submit | Prevented (`if (!note.trim()) return;`) |
| Glass effect | Both modal-overlay and modal itself have `backdrop-filter` |
| Escape key | Closes modal |
| Case with null fields | `formatDate` returns "—" placeholder |
| Long audit log | Scrollable via `.modal-body` overflow |

---

## ChartRenderer

**File**: `charts/ChartRenderer.js`

### Purpose

Renders any chart type based on the `chartType` string. Dispatches to Recharts components for 18+ chart types.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `chartType` | `string` | — | Chart type key (e.g. `'bar'`, `'line'`, `'pie'`) |
| `data` | `Array` | — | Data array for the chart |
| `config` | `object` | `{}` | Chart configuration (e.g. `{ animation_enabled: true }`) |
| `height` | `number` | `240` | Chart height in pixels |
| `compact` | `boolean` | `false` | Compact mode for card previews |

### Supported Chart Types

| Type | Recharts Component | Data Shape |
|---|---|---|
| `bar` (default) | `BarChart` | categorical |
| `line` | `LineChart` | timeseries |
| `area` | `AreaChart` | timeseries |
| `pie` | `PieChart` | categorical |
| `donut` | `PieChart` (with innerRadius) | categorical |
| `stackedBar` | `BarChart` (stackId) | stacked |
| `stackedArea` | `AreaChart` (stackId) | stacked |
| `radar` | `RadarChart` | categorical |
| `radialBar` | `RadialBarChart` | categorical |
| `composed` | `ComposedChart` | timeseries |
| `scatter` | `ScatterChart` | xy |
| `treemap` | `Treemap` | hierarchy |
| `funnel` | `FunnelChart` | categorical |
| `kpi` | Custom div | single |
| `gauge` | Custom SVG | single |
| `progress` | Custom div | single |
| `heatmap` | Custom grid | matrix |

### States

| State | Behavior |
|---|---|
| **No data / empty array** | Renders `ChartEmpty` component |
| **Has data** | Renders the appropriate chart |
| **Compact mode** | Smaller margins, smaller radii, no grid lines, smaller labels |
| **Animation disabled** | `isAnimationActive={false}` |

### Tooltip Styling

```js
contentStyle: {
  borderRadius: 8, border: '1px solid var(--border)',
  fontSize: 13, background: 'var(--surface)',
  color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)',
}
cursor: { fill: 'var(--surface-hover)' }
```

### Dependencies

- `recharts` (BarChart, LineChart, PieChart, etc.)
- `ChartEmpty`
- `CHART_COLORS` from `ChartRegistry`

### Edge Cases

| Scenario | Behavior |
|---|---|
| Unknown `chartType` | Defaults to bar chart rendering |
| Data with missing keys | May cause Recharts rendering errors |
| Single data point for line chart | Renders a single point with dot |
| Very large numbers | `toLocaleString()` in KPI display |

---

## ChartEmpty

**File**: `charts/ChartEmpty.js`

### Purpose

Placeholder shown when a chart has no data to display.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `'No data available.'` | Empty state message |
| `height` | `number` | `240` | Container height |

### Dependencies

- CSS classes: `.empty-state`

---

## ChartError

**File**: `charts/ChartError.js`

### Purpose

Error state for chart data loading failures, with optional retry button.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `'Failed to load chart data.'` | Error description |
| `onRetry` | `() => void` | — | Retry callback (optional) |
| `height` | `number` | `240` | Container height |

### Dependencies

- CSS classes: `.error-state`, `.btn`, `.btn-ghost`

---

## ChartSkeleton

**File**: `charts/ChartSkeleton.js`

### Purpose

Skeleton loading placeholder for chart cards. Shows pulsing shimmer shapes.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `height` | `number` | `240` | Skeleton chart preview height |
| `count` | `number` | `1` | Number of skeleton cards to show |

### States

| State | Behavior |
|---|---|
| `count=1` | Single skeleton card with title bar + chart area |
| `count>1` | Grid of skeleton cards |
| Animation | `motion.div` with pulsing opacity via `animate` prop |

### Dependencies

- `motion`
- CSS classes: `.skeleton`, `.chart-card`, `.vis-skeleton-grid`

---

## ChartRegistry

**File**: `charts/ChartRegistry.js`

### Purpose

Data-only module containing all chart type definitions, color palettes, categories, data sources, sizes, and icons. No JSX — pure configuration data.

### Exports

| Export | Type | Description |
|---|---|---|
| `CHART_TYPES` | `object` | 17 chart types + 7 case-specific presets with metadata (label, dataShape, category, optional dataSource) |
| `CHART_COLORS` | `string[]` | 10-color sequence for chart series |
| `CATEGORIES` | `Array` | 6 filter categories (All, Standard, Comparative, Statistical, KPI, Cases) |
| `DATA_SOURCES` | `Array` | 7 data source options for visualisations |
| `CHART_SIZES` | `Array` | 4 size options (small, medium, large, full) with grid dimensions |
| `COLOUR_THEMES` | `Array` | 5 colour themes (default, warm, cool, forest, mono) with color swatches |
| `CHART_ICONS` | `object` | Emoji icons for each chart type |

### Chart Type Categories

| Category | Chart Types |
|---|---|
| Standard | bar, line, pie, donut, area |
| Comparative | stackedBar, stackedArea, radar, radialBar, composed |
| Statistical | scatter, heatmap, treemap |
| KPI | gauge, kpi, progress, funnel |
| Cases | cases-byType, cases-byMonth, cases-byPriority, cases-byStatus, cases-byMagistrate, user-activity, cases-total |

### Colour Themes

| Theme | Colors |
|---|---|
| default | `#1e6bb8`, `#0d7c3f`, `#b8942e`, `#b91c1c`, `#6b48d1` |
| warm | `#f97316`, `#dc2626`, `#eab308`, `#ec4899`, `#92400e` |
| cool | `#0ea5e9`, `#06b6d4`, `#14b8a6`, `#6366f1`, `#8b5cf6` |
| forest | `#166534`, `#15803d`, `#22c55e`, `#65a30d`, `#0f766e` |
| mono | `#475569`, `#64748b`, `#94a3b8`, `#cbd5e1`, `#334155` |

---

## Global Dependencies & Patterns

### Shared Libraries

| Library | Version (approx.) | Usage |
|---|---|---|
| `motion` (framer-motion) | v12+ | All entrance/exit/hover animations |
| `axios` | — | All HTTP requests |
| `recharts` | — | Chart rendering |
| `React` | — | Component library |

### Context Dependencies

| Context | Provides | Used By |
|---|---|---|
| `AuthContext` | `user`, `logout` | Sidebar, NotificationBell |
| `ThemeContext` | `theme`, `setTheme` | Sidebar |
| `ToastContext` | `success`, `error` | DocumentPanel, PlaylistPanel, CaseDetailModal |

### Common CSS Patterns

All components rely on CSS classes defined in `index.css`. Key classes used across components:

| Category | Key Classes |
|---|---|
| Layout | `.modal-overlay`, `.modal`, `.app-shell`, `.sidebar`, `.page-content` |
| Controls | `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-accent`, `.btn-danger`, `.btn-sm`, `.btn-icon` |
| Forms | `.form-group`, `.form-label`, `.form-input`, `.form-select`, `.form-textarea`, `.form-error` |
| Feedback | `.spinner`, `.spinner-sm`, `.skeleton`, `.empty-state`, `.error-state` |
| Badges | `.badge`, `.badge-{status}`, `.badge-{type}`, `.role-badge.{role}`, `.priority-dot` |

### Animation Tokens (Standard Values)

| Property | Value |
|---|---|
| Default transition duration | `0.15s` |
| Entrance animation duration | `0.2s` – `0.35s` |
| Modal spring bounce | `0.15` |
| Easing (most animations) | `easeOut` |
| Stagger delay increment | `0.02s` – `0.05s` per child |
