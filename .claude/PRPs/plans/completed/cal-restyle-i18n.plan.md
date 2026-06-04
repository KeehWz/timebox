# Plan: Cal.com Re-skin + Navigation Shell + zh/en i18n

## Summary
Restyle the existing Timebox UI to Cal.com's neutral, crisp aesthetic by re-skinning the design tokens (keeping the CSS-Modules architecture), add a Cal-style persistent navigation shell (mobile bottom tabs / desktop sidebar) that also fixes the "no way to reach the daily page from Home" gap, and introduce a lightweight, type-safe Chinese/English language switch. No login/auth page.

## User Story
As a Timebox user, I want a clean Cal.com-style interface I can navigate between "Track" and "Today", in either Chinese or English, so the app feels polished and usable regardless of my language.

## Problem → Solution
**Current**: warm "Quiet Focus" palette, colorful surfaces, large radii; navigation is flow-only (no way to reach `/day` from Home — review finding M3); all UI strings hardcoded in Chinese.
**Desired**: Cal.com neutral grayscale chrome (Inter, subtle borders, near-black primary buttons, small radii) with category accents retained; a persistent nav shell on Home/Today; a `中 / EN` toggle that switches every string, persisted and reactive.

## Metadata
- **Complexity**: Large (~30 files: new i18n module + shell, token re-skin, string extraction across all components, test updates)
- **Source PRD**: N/A (free-form)
- **PRD Phase**: N/A
- **Estimated Files**: ~32 (8 new, ~24 modified)
- **Decisions locked (user)**: re-skin tokens (keep CSS Modules) · lightweight custom i18n (context + `useT` + localStorage) · visual + navigation shell (no dark mode) · no login page

---

## UX Design

### Before
```
(flow-only; warm palette; Chinese-only)
/  Home picker ──► /active ──► /summary/:id ──► /day
                                  (查看今天)        ▲ only entry to daily
```

### After
```
Desktop (≥768px)                     Mobile (<768px)
┌────────┬──────────────────┐        ┌──────────────────────┐
│ ⏱      │  你想记录什么?     │        │            [中|EN] ☰ │
│ Timebox│  / What to track? │        │  你想记录什么?         │
│        │  ┌────┐┌────┐     │        │  ┌────┐┌────┐         │
│ ▸ 记录  │  │工作││学习│ ... │        │  │工作││学习│ ...      │
│   今天  │  └────┘└────┘     │        │  └────┘└────┘         │
│        │                  │        │                      │
│ [中|EN]│                  │        ├──────────────────────┤
└────────┴──────────────────┘        │  ⏱ 记录    📅 今天    │ ← bottom tabs
                                      └──────────────────────┘
Active timer & Summary = full-screen focus flows (NO shell chrome).
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Reach daily page | Only via summary's “查看今天” | Persistent nav tab “今天 / Today” | Fixes review finding M3 |
| Switch language | — | `中 / EN` toggle (sidebar footer / mobile header) | Persisted, reactive, updates `<html lang>` |
| Visual style | Warm paper, colorful, big radii | Cal.com neutral chrome, Inter, small radii, category accents kept | Token-level re-skin |
| Active/Summary | Standalone | Standalone, **no** nav chrome | Keep focus flows distraction-free |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/styles/tokens.css` | all | The single file whose values drive the entire re-skin |
| P0 | `src/domain/categories.ts` | all | `label`/`hint` move to i18n; keep `id`/`icon`/`colorVar` |
| P0 | `src/App.tsx` | all | Routing → wrap Home/Daily in a layout route (AppShell); keep resume redirect |
| P0 | `src/routes/DailyScreen.tsx` | all | `formatDayLabel`/nav strings → i18n; uses the nav shell |
| P1 | `src/components/category-picker/CategoryPicker.tsx`, `CategoryTile.tsx`, `NoteForm.tsx` | all | String extraction + category label via `t` |
| P1 | `src/components/timer/{PauseButton,LongPressEndButton}.tsx`, `summary/SessionSummary.tsx`, `daily/{DailyTotals,DailyTimeline,SessionRow}.tsx`, `ui/CategoryBadge.tsx` | all | String extraction |
| P1 | `src/main.tsx` | all | Wrap app in `<I18nProvider>` |
| P1 | `/Users/zhenwu/.claude/rules/web/coding-style.md`, `web/performance.md` | all | Token/CSS conventions; font-loading (Inter), 2-family max, swap |
| P2 | `src/components/category-picker/category-picker.module.css` | all | Representative CSS-module pattern to mirror for new shell CSS |
| P2 | `src/test/setup.ts`, any `*.test.tsx` | all | Tests now need an i18n provider wrapper |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Cal.com colors | design.cal.com/basics/colors | Grayscale brand: near-black text `#242424`, mid-gray `#898989`, white/gray-50 surfaces, gray-200 borders. Aliases: `bg-default`, `bg-muted`, `border-subtle`, `text-emphasis/default/subtle`. |
| Cal.com type/shape | Cal design system | **Inter** body; tight headings (Cal Sans is their display face — we substitute Inter 600 tight); buttons `rounded-md` (~6–8px); subtle ring+shadow elevation (`0 0 0 1px` + soft shadow). |
| Inter font (self-host) | @fontsource-variable/inter | Self-hosted variable Inter → offline-friendly PWA, `font-display: swap`. |
| Intl.DateTimeFormat | MDN | `new Intl.DateTimeFormat('zh-CN'|'en-US', {year,month,day})` for localized day labels; supports tabular via `font-variant-numeric`. |

```
KEY_INSIGHT: Cal.com chrome is neutral grayscale (chroma ≈ 0); color is used sparingly.
APPLIES_TO: tokens.css surface/text/border values.
GOTCHA: Keep the --cat-* category accents (semantic core of a time tracker) but set chrome chroma to ~0. The synthesis = neutral Cal shell + colored category accents.

KEY_INSIGHT: i18n must enforce zh/en key parity at compile time.
APPLIES_TO: src/i18n/messages.ts.
GOTCHA: Derive MessageKey from the zh dict and type the en dict as Record<MessageKey,string> so a missing translation is a TYPE error, not a runtime fallback.

KEY_INSIGHT: All component tests currently render bare and assert Chinese text.
APPLIES_TO: every *.test.tsx that renders a component using useT.
GOTCHA: useT throws without a provider — add a renderWithI18n helper; default locale 'zh' keeps existing zh assertions valid.
```

> External research: Cal.com aesthetic confirmed via design.cal.com. i18n + Intl are well-understood; no further research needed.

---

## Patterns to Mirror

### CSS_MODULE + TOKENS (existing — mirror for new shell CSS)
```css
/* SOURCE: src/components/category-picker/category-picker.module.css */
.tile {
  --accent: var(--cat-other);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-hairline);
  transition: transform var(--duration-fast) var(--ease-out-expo);
}
```
All styling reads tokens — so the re-skin is a `tokens.css` value swap; component CSS rarely changes.

### COMPONENT_PATTERN (existing — mirror for new components)
```tsx
// SOURCE: src/components/ui/CategoryBadge.tsx
interface CategoryBadgeProps { categoryId: CategoryId; size?: 'sm' | 'md' }
export function CategoryBadge({ categoryId, size = 'md' }: CategoryBadgeProps) {
  const category = getCategory(categoryId)
  // ... styles[...] + CSS var via `as CSSProperties`
}
```

### CSS_VAR_INLINE (existing — typed custom property)
```tsx
// SOURCE: src/components/category-picker/CategoryTile.tsx
style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
```

### TEST_STRUCTURE (existing — RTL + cleanup already wired)
```tsx
// SOURCE: src/components/category-picker/CategoryPicker.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// NEW: components using i18n must render through renderWithI18n (see Task 7)
```

### I18N_CONTEXT (to establish)
```tsx
// SOURCE: to establish — src/i18n/I18nContext.tsx
const I18nCtx = createContext<I18nValue | null>(null)
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => loadLocale())
  useEffect(() => { document.documentElement.lang = locale; saveLocale(locale) }, [locale])
  const value = useMemo<I18nValue>(() => ({
    locale,
    setLocale: setLocaleState,
    t: (key, params) => translate(messages[locale], key, params),
  }), [locale])
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}
export function useT(): I18nValue {
  const ctx = useContext(I18nCtx)
  if (!ctx) throw new Error('useT must be used within <I18nProvider>')
  return ctx
}
```

### TYPED_MESSAGES (to establish — compile-time key parity)
```ts
// SOURCE: to establish — src/i18n/messages.ts
const zh = {
  'home.title': '你想记录什么？',
  'category.work.label': '工作',
  'summary.pauseValue': '{count} 次 · 共 {total}',
  // ...all keys
} as const
export type MessageKey = keyof typeof zh
const en: Record<MessageKey, string> = {
  'home.title': 'What are you tracking?',
  'category.work.label': 'Work',
  'summary.pauseValue': '{count} pauses · {total} total',
  // missing key here => COMPILE ERROR
}
export const messages = { zh, en } as const
```

---

## Cal.com Token Re-skin (concrete target values for `src/styles/tokens.css`)

```css
:root {
  /* surfaces — neutral grayscale (chroma 0), Cal "bg-default / bg-muted" */
  --color-bg: oklch(98.5% 0 0);          /* app background (gray-50-ish) */
  --color-surface: oklch(100% 0 0);      /* cards / bg-default */
  --color-surface-sunken: oklch(97% 0 0);/* bg-muted */
  --color-ink: oklch(24% 0 0);           /* text-emphasis (~#242424) */
  --color-ink-soft: oklch(45% 0 0);      /* text-default */
  --color-ink-faint: oklch(62% 0 0);     /* text-subtle (~#898989) */
  --color-hairline: oklch(92% 0 0);      /* border-subtle (gray-200) */

  /* category accents — KEPT (semantic), unchanged */
  --cat-work: oklch(62% 0.16 250); /* ...etc (unchanged) */

  /* typography — Inter everywhere (self-hosted), 1 family */
  --font-sans: 'InterVariable', 'Inter', system-ui, -apple-system, 'Segoe UI',
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  --font-numeric: var(--font-sans); /* timer uses Inter + tabular-nums */
  --text-sm: 0.8125rem;            /* 13px — Cal is compact */
  --text-base: 0.9375rem;          /* 15px */
  --text-lg: 1.125rem;
  --text-xl: clamp(1.4rem, 1.1rem + 1vw, 1.875rem);
  --text-timer: clamp(3rem, 1.8rem + 10vw, 6rem);

  /* radius — Cal small */
  --radius-sm: 0.375rem;  /* 6px */
  --radius-md: 0.5rem;    /* 8px */
  --radius-lg: 0.75rem;   /* 12px */
  --radius-pill: 9999px;

  /* elevation — Cal ring + soft shadow */
  --shadow-sm: 0 0 0 1px oklch(0% 0 0 / 0.04), 0 1px 2px oklch(0% 0 0 / 0.06);
  --shadow-md: 0 0 0 1px oklch(0% 0 0 / 0.04), 0 4px 12px oklch(0% 0 0 / 0.08);
  /* spacing/motion/safe-area: unchanged */
}
```
Most component CSS needs **no change** (reads tokens). Targeted tweaks only: timer font (now Inter tabular), heading letter-spacing (`-0.02em`), button weight 600.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/i18n/locale.ts` | CREATE | `Locale` type, `detectLocale()`, `loadLocale()`/`saveLocale()` (localStorage `timebox.locale`) |
| `src/i18n/messages.ts` | CREATE | Typed zh/en catalog (compile-time parity) |
| `src/i18n/I18nContext.tsx` | CREATE | `I18nProvider`, `useT`, `translate()` interpolation |
| `src/i18n/messages.test.ts` | CREATE | Runtime parity test (en keys == zh keys) + interpolation |
| `src/i18n/I18nContext.test.tsx` | CREATE | `t` lookup, `{param}` interpolation, locale switch |
| `src/test/renderWithI18n.tsx` | CREATE | RTL helper wrapping `<I18nProvider>` (+ router where needed) |
| `src/components/shell/AppShell.tsx` | CREATE | Layout: nav (sidebar/bottom-tabs) + `<Outlet/>`; resume redirect lives here or App |
| `src/components/shell/NavBar.tsx` | CREATE | Nav items (Track `/`, Today `/day`) with active state |
| `src/components/shell/LanguageToggle.tsx` | CREATE | `中 / EN` segmented toggle → `setLocale` |
| `src/components/shell/shell.module.css` | CREATE | Sidebar (≥768px) / bottom-tabs (<768px), Cal styling |
| `src/components/shell/*.test.tsx` | CREATE | NavBar active state, LanguageToggle switches locale |
| `src/styles/tokens.css` | UPDATE | Cal re-skin values (above) |
| `src/styles/typography.css` | UPDATE | Inter weights, tight headings, tabular util |
| `src/main.tsx` | UPDATE | Import Inter font; wrap `<App/>` in `<I18nProvider>` |
| `src/App.tsx` | UPDATE | Nested layout route: `<Route element={<AppShell/>}>` wraps `/`,`/day`,`/day/:date`; `/active`,`/summary/:id` outside shell |
| `src/domain/categories.ts` | UPDATE | Drop `label`/`hint`; keep `id`/`icon`/`colorVar` (labels move to i18n keys `category.<id>.label/.hint`) |
| `src/domain/time.ts` | UPDATE | `formatDuration(ms, locale)` (localized h/m/s units), `formatDayLabel(epochMs, locale)` via `Intl.DateTimeFormat` |
| `src/domain/time.test.ts` | UPDATE | Add locale cases for duration units + day label |
| `src/components/**` (CategoryPicker, CategoryTile, NoteForm, PauseButton, LongPressEndButton, ProgressRing n/a, SessionSummary, DailyTotals, DailyTimeline, SessionRow, CategoryBadge) | UPDATE | Replace hardcoded strings with `useT().t(...)`; category label/hint via `t('category.<id>.label')` |
| `src/routes/**` (HomeScreen, ActiveSessionScreen, SummaryScreen, DailyScreen) | UPDATE | String extraction; DailyScreen uses `formatDayLabel(_, locale)`; Active “已暂停” via `t` |
| `src/components/**/*.test.tsx` (8 files) | UPDATE | Use `renderWithI18n`; assertions stay zh (default locale) |
| `tests/e2e/core-flow.spec.ts` | UPDATE | Keep zh selectors (default); add a language-switch test (toggle → EN strings); regenerate visual baselines |
| `package.json` | UPDATE | Add `@fontsource-variable/inter` |
| `index.html` | UPDATE | `<title>` neutral “Timebox”; (optional) preconnect not needed (self-host) |

## NOT Building
- ❌ Login / auth / account page (explicitly excluded)
- ❌ Dark mode / theme toggle (user chose visual + nav only)
- ❌ Tailwind / shadcn migration (re-skin within CSS Modules)
- ❌ Cal Sans display font dependency (substitute Inter 600 tight; optional later)
- ❌ Language auto-detect beyond first-run navigator check (no geo/IP)
- ❌ Localizing code comments or the brand name "Timebox"
- ❌ RTL languages, additional locales beyond zh/en
- ❌ Changing any domain logic, data layer, or timer behavior (pure restyle + i18n)

---

## Step-by-Step Tasks

### Task 1: i18n core (locale + provider + useT)
- **ACTION**: Create the i18n module foundation.
- **IMPLEMENT**: `src/i18n/locale.ts` — `export type Locale = 'zh' | 'en'`; `detectLocale()` → `navigator.language.startsWith('zh') ? 'zh' : 'en'`; `loadLocale()` reads `localStorage['timebox.locale']`, validates against `['zh','en']`, else `detectLocale()`; `saveLocale(l)`. `src/i18n/I18nContext.tsx` per **I18N_CONTEXT** snippet with `translate(dict, key, params)` doing `{param}` replacement.
- **MIRROR**: I18N_CONTEXT.
- **IMPORTS**: `createContext, useContext, useState, useEffect, useMemo` from react; `messages, MessageKey` (Task 2).
- **GOTCHA**: Guard `localStorage` access in a `try/catch` (private mode). `useT` throws without provider — that's intended. Set `document.documentElement.lang` in an effect.
- **VALIDATE**: `npm run typecheck`; provider compiles.

### Task 2: Typed message catalog (zh from current strings + en)
- **ACTION**: Build the full zh/en dictionary with compile-time parity.
- **IMPLEMENT**: `src/i18n/messages.ts` per **TYPED_MESSAGES**. Keys (from the string inventory): `home.title`, `home.subtitle`; `category.{work,study,rest,exercise,chores,other}.{label,hint}`; `note.back`, `note.start`, `note.tip`, `note.placeholderAria` (`'{category}的具体内容（可选）'`/`'{category} details (optional)'`); `timer.pause`, `timer.resume`, `timer.pausedNote` (`'已暂停 · 暂停 {duration}'`), `timer.endLabel`, `timer.endAria`, `timer.endConfirm`; `summary.title`, `summary.focusLabel`, `summary.start`, `summary.end`, `summary.span`, `summary.pauses`, `summary.pauseValue` (`'{count} 次 · 共 {total}'`), `summary.longestPause`, `summary.done`, `summary.viewToday`; `daily.summaryTitle`, `daily.pausedTotal` (`'暂停共 {duration}'`), `daily.spanTotal` (`'总跨度 {duration}'`), `daily.empty`, `daily.loading`, `daily.ongoing`, `daily.prevDayAria`, `daily.nextDayAria`, `daily.backToToday`, `daily.startNew`; `nav.track`, `nav.today`; `lang.toggleAria`.
- **MIRROR**: TYPED_MESSAGES.
- **IMPORTS**: `Locale` from `./locale`.
- **GOTCHA**: Derive `MessageKey` from `zh`; type `en: Record<MessageKey, string>` so a missing/typo'd key is a compile error. Keep `{count}`/`{total}`/`{duration}`/`{category}` placeholders identical across locales.
- **VALIDATE**: `npm run typecheck` (omit an en key → expect error, then restore).

### Task 3: Categories → i18n + localized domain formatters
- **ACTION**: Move category text to i18n; localize duration & date.
- **IMPLEMENT**:
  - `src/domain/categories.ts`: `Category` becomes `{ id: CategoryId; icon: string; colorVar: string }` (drop `label`/`hint`). Keep `CATEGORIES`, `getCategory`, `isCategoryId`. Add nothing else (labels resolved via `t('category.'+id+'.label')`).
  - `src/domain/time.ts`: add `formatDuration(ms: number, locale: Locale): string` — same h/m/s logic as `formatHuman` but units from a locale map (`zh: { h:'时', m:'分', s:'秒' }`, `en: { h:'h', m:'m', s:'s' }`); keep `formatHuman` (used internally/tests) or re-implement `formatDuration` and have components use it. Add `formatDayLabel(epochMs: number, locale: Locale): string` using `new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { year:'numeric', month:'long', day:'numeric' }).format(new Date(epochMs))`. `formatClock`/`formatTimeOfDay` stay locale-neutral.
- **MIRROR**: existing pure-function style in `time.ts`.
- **IMPORTS**: `Locale` from `../i18n/locale`.
- **GOTCHA**: Importing `Locale` into `domain/time.ts` couples domain→i18n type only (a string union, no React) — acceptable and keeps formatters pure/testable. `DailyScreen` currently builds the day key from a `dayKey` string, not epoch — convert: parse `dayKey` (`y,m,d`) to a local `Date` for `formatDayLabel`, or add a `dayKeyLabel(dayKey, locale)` helper. Provide `dayKeyLabel`.
- **VALIDATE**: `npm test -- src/domain` (add cases: `formatDuration(4_440_000,'en')==='1h 14m'`, `'zh'` units; `dayKeyLabel('2026-05-28','en')` contains `May`).

### Task 4: Extract strings in components & routes
- **ACTION**: Replace every hardcoded UI string with `t(...)`.
- **IMPLEMENT**: In each string-bearing file (inventory): `const { t, locale } = useT()`. Examples: CategoryPicker → `t('home.title')`, `t('home.subtitle')`; CategoryTile → `t('category.'+category.id+'.label')`, `.hint`; NoteForm → `t('note.start')`, `t('note.tip')`, `t('note.back')`, aria `t('note.placeholderAria', { category: t('category.'+id+'.label') })`; PauseButton → `t(paused?'timer.resume':'timer.pause')`; LongPressEndButton → `t('timer.endLabel')`, `t('timer.endAria')`, `window.confirm(t('timer.endConfirm'))`; ActiveSessionScreen → `t('timer.pausedNote', { duration: formatDuration(totalPausedMs(current, now), locale) })`; SessionSummary → all dt labels + `t('summary.pauseValue', { count: pauses, total: formatDuration(paused, locale) })` + durations via `formatDuration(_, locale)`; DailyTotals/Timeline/SessionRow → titles, `daily.ongoing`, totals via `formatDuration(_, locale)`; DailyScreen → nav arias, `daily.backToToday`, `daily.startNew`, `daily.loading`, day label via `dayKeyLabel(dayKey, locale)`; SummaryScreen → `t('summary.viewToday')`, `t('summary.done')`.
- **MIRROR**: COMPONENT_PATTERN; keep glyph-only marks (‹ › ＋ ✓ ⏸ –) as decorative (aria-hidden where needed) and pair with localized aria/labels.
- **IMPORTS**: `useT` from `../../i18n/I18nContext`; `formatDuration`/`dayKeyLabel` from domain/time.
- **GOTCHA**: Components are pure renderers — `useT` is a hook, call it at top level (not in callbacks). Replace `formatHuman` usages in UI with `formatDuration(_, locale)`. The CategoryBadge/Tile previously read `category.label`; now resolve via `t`.
- **VALIDATE**: `npm run typecheck`; visually `npm run dev`.

### Task 5: Cal.com token re-skin
- **ACTION**: Swap token values; add Inter; minor type tweaks.
- **IMPLEMENT**: Update `src/styles/tokens.css` to the **Cal.com Token Re-skin** values. `npm install @fontsource-variable/inter`; import `'@fontsource-variable/inter'` in `src/main.tsx` (top). `src/styles/typography.css`: ensure headings use `letter-spacing:-0.02em; font-weight:600`; `.tabular` unchanged; body `font-size: var(--text-base)`. Tweak primary buttons (already `--color-ink` bg) to `font-weight:600`. Timer `.clock` now uses `var(--font-numeric)` = Inter + `font-variant-numeric: tabular-nums`.
- **MIRROR**: existing tokens.css structure; `web/performance.md` font rules (self-host, swap, ≤2 families — now 1).
- **IMPORTS**: font package import in main.tsx.
- **GOTCHA**: Keep `--cat-*` accents unchanged (don't grayscale the categories). `@fontsource-variable/inter` ships woff2 — already covered by the PWA `globPatterns` (`woff2`). Verify contrast: near-black primary buttons + white text = AA pass.
- **VALIDATE**: `npm run build`; `npm run dev` — chrome looks Cal-neutral, categories still colored.

### Task 6: Cal navigation shell + routing
- **ACTION**: Add the persistent nav shell and rewire routes.
- **IMPLEMENT**:
  - `src/components/shell/NavBar.tsx`: items `[{to:'/', key:'nav.track', icon}, {to:'/day', key:'nav.today', icon}]`; use `NavLink` for active state; labels via `t`.
  - `src/components/shell/LanguageToggle.tsx`: segmented `中 | EN` buttons → `setLocale('zh'|'en')`, `aria-label={t('lang.toggleAria')}`, active state on current locale.
  - `src/components/shell/AppShell.tsx`: renders sidebar (desktop) / bottom tab bar (mobile) containing NavBar + LanguageToggle + brand, plus `<Outlet/>` for the page; respects safe-area.
  - `src/components/shell/shell.module.css`: `@media (min-width:768px)` sidebar layout; below, fixed bottom tab bar (`padding-bottom: var(--safe-bottom)`), content padding to clear it.
  - `src/App.tsx`: `<Route element={<AppShell/>}>` wraps `/`, `/day`, `/day/:date`; `/active` and `/summary/:id` stay top-level (no shell). Keep the resume-on-load redirect (move into AppShell or keep in App around `<Routes>`).
- **MIRROR**: COMPONENT_PATTERN, CSS_MODULE+TOKENS; semantic `<nav aria-label>`.
- **IMPORTS**: `NavLink, Outlet` from react-router-dom; `useT`.
- **GOTCHA**: Active session resume still must win — the redirect (`session && pathname==='/' → /active`) runs above the shell. The shell must NOT render on `/active` (keeps focus). Use `react-refresh`-friendly named exports. Bottom tab bar must not overlap the long-press button (Active screen has no shell, so fine).
- **VALIDATE**: `npm run dev` — tabs switch Home↔Daily; Active/Summary have no chrome; language toggle flips all strings live.

### Task 7: Test helper + update component tests
- **ACTION**: Make tests provider-aware; add i18n/shell tests.
- **IMPLEMENT**:
  - `src/test/renderWithI18n.tsx`: `export function renderWithI18n(ui, { route } = {})` → wraps in `<I18nProvider>` (and `<MemoryRouter>` when a component uses router hooks/NavLink). Provide both `renderWithI18n` and a router variant.
  - Update the 8 component tests to use `renderWithI18n`. Assertions stay Chinese (default locale `zh`), so most expectations are unchanged.
  - `src/i18n/messages.test.ts`: assert `Object.keys(messages.en)` set === `Object.keys(messages.zh)` set (runtime parity guard backing the compile-time one); assert no `{` leftover after interpolation for a sampled key.
  - `src/i18n/I18nContext.test.tsx`: render a probe component, assert `t('home.title')` = zh value, switch via `setLocale('en')`, assert English; test interpolation `summary.pauseValue`.
  - Shell tests: NavBar active state (render at `/day` via MemoryRouter, “Today” active); LanguageToggle click switches rendered strings.
- **MIRROR**: TEST_STRUCTURE; existing cleanup in `src/test/setup.ts`.
- **IMPORTS**: `I18nProvider` from i18n; `MemoryRouter` from react-router-dom.
- **GOTCHA**: Components using `NavLink`/`useNavigate` need a router in tests → renderWithI18n router variant. `PauseButton`/`SessionRow` etc. that read category label now need the provider. Coverage: i18n module + shell are included (routes excluded) — test them to keep ≥80%.
- **VALIDATE**: `npm run test:coverage` — all green, ≥80%.

### Task 8: E2E + visual-regression refresh
- **ACTION**: Update E2E for the shell/i18n and regenerate baselines (re-skin changes pixels).
- **IMPLEMENT**:
  - `tests/e2e/core-flow.spec.ts`: default locale zh → existing flow selectors mostly hold; update any changed copy. Add a test: on Home, click `中/EN` → assert an English string (e.g., “What are you tracking?”) and that nav shows “Track/Today”. Add a nav test: from Home tap “今天/Today” tab → `/day`.
  - Regenerate screenshots: `npm run test:e2e:update` (re-skin + shell change baselines); commit new `home-*.png`. Consider masking the live timer if any active-screen screenshot is added (it isn't — Home only).
- **MIRROR**: existing Playwright config (`maxDiffPixelRatio: 0.02`).
- **IMPORTS**: none new.
- **GOTCHA**: Bottom tab bar changes Home layout height → baselines differ at all 4 widths (expected; regenerate). Language preference persists in localStorage across the test — reset in `beforeEach` (`localStorage.clear()` alongside the existing `indexedDB.deleteDatabase`).
- **VALIDATE**: `npm run test:e2e` green against new baselines.

### Task 9: Full validation
- **ACTION**: Run all gates.
- **IMPLEMENT**: typecheck, lint, unit+coverage, build, e2e; clean transient dirs before final lint.
- **VALIDATE**: all green (see Validation Commands).

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected | Edge? |
|---|---|---|---|
| messages parity | keys(en) vs keys(zh) | equal sets | ✅ missing-key guard |
| translate interpolation | `summary.pauseValue`,{count:3,total:'9m'} | zh: `3 次 · 共 9m` | ✅ params |
| useT switch | setLocale('en') | `home.title`→English | ✅ reactivity |
| formatDuration locale | 4_440_000,'zh' / 'en' | `1时14分` / `1h 14m` | ✅ units |
| dayKeyLabel | '2026-05-28','en' | contains `May` & `28` & `2026` | ✅ Intl |
| NavBar active | route `/day` | “Today” has active state | ✅ |
| LanguageToggle | click EN | strings become English | ✅ |
| (existing component tests) | via renderWithI18n | unchanged zh assertions pass | regression |

### Edge Cases Checklist
- [ ] localStorage unavailable (private mode) → falls back to detect, no crash
- [ ] Unknown stored locale value → falls back to detect
- [ ] Missing translation key → compile error (parity), runtime returns key (no crash)
- [ ] Locale switch updates `<html lang>` and persists across reload
- [ ] Category labels/hints localize in picker, badge, summary, daily
- [ ] Durations & day labels localize; clock (HH:MM:SS) stays neutral
- [ ] Active/Summary render without nav chrome; Home/Daily render with it
- [ ] Reduced motion / safe-area still respected in the new shell

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck   # tsc -b (strict) — zero errors
npm run lint        # eslint — zero errors
```
### Unit / Coverage
```bash
npm run test:coverage   # ≥80% (i18n + shell covered; routes excluded)
```
EXPECT: all pass, thresholds met.
### Build
```bash
npm run build   # tsc -b && vite build (+ PWA, Inter woff2 precached)
```
### E2E + Visual Regression
```bash
npm run test:e2e:update   # regenerate baselines after re-skin (once)
npm run test:e2e          # green against new baselines
```
### Manual Validation
- [ ] `npm run dev` → Home shows nav shell; toggle `中/EN` flips every string live
- [ ] Tabs navigate Home ↔ Today; Active/Summary have no chrome
- [ ] Reload keeps chosen language; `<html lang>` correct
- [ ] Cal-neutral chrome; category colors retained; AA contrast on buttons

---

## Acceptance Criteria
- [ ] All tasks complete; all validation green
- [ ] Every UI string switches between zh/en; choice persisted
- [ ] Compile-time key parity enforced (en typed against zh keys)
- [ ] Cal.com neutral aesthetic applied via tokens; category accents kept
- [ ] Persistent nav shell on Home/Daily; daily reachable from Home (M3 fixed)
- [ ] No login page; no dark mode; no domain/data/timer behavior change

## Completion Checklist
- [ ] Strings centralized in `src/i18n/messages.ts` (none hardcoded in components)
- [ ] `useT` used at top level of components; no logic in domain changed
- [ ] Tests use `renderWithI18n`; i18n + shell covered
- [ ] Visual baselines regenerated & committed
- [ ] Inter self-hosted; ≤2 font families; PWA still builds/precaches
- [ ] No type/lint errors; coverage ≥80%

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Broad test churn (provider needed everywhere) | High | Med | `renderWithI18n` helper; default zh keeps assertions stable |
| Visual baselines all change | High (expected) | Low | Regenerate once via `test:e2e:update`, review, commit |
| Coverage dip from new i18n/shell code | Med | Med | Unit-test i18n + shell; routes already excluded |
| Category refactor (drop label/hint) breaks references | Med | Med | TS surfaces every usage; fix via `t('category.<id>.label')` |
| Domain `time.ts` importing `Locale` feels like a layer leak | Low | Low | It's a type-only string union; formatters stay pure/testable |
| Inter variable font bundle size | Low | Low | Variable woff2 is compact; `font-display: swap`; precached |
| Bottom tab bar overlaps content / notch | Med | Low | Content padding-bottom + `var(--safe-bottom)`; shell absent on Active |

## Notes
- **Synthesis decision**: Cal.com chrome is grayscale, but a time tracker needs per-category color — so neutral shell + retained `--cat-*` accents. Stated explicitly to avoid "graying out" the categories.
- **Why custom i18n over react-i18next**: ~40 keys, no plural/gender complexity (zh has no plurals; en minimal), compile-time key safety, zero bundle cost — matches the app's lightweight ethos. react-i18next remains a clean future swap if locales/pluralization grow.
- **Default locale**: first run detects from `navigator.language` (zh* → zh, else en); thereafter the stored choice wins.
- **Out-of-scope but adjacent**: the review's M1 (date-param validation) and M2 (useLongPress cleanup) are NOT part of this plan — track separately.
- **Login**: intentionally skipped ("先不做登陆页"); the nav shell has no auth/user menu.
```
