# Plan: Timebox — Lightweight Session Time Tracker (MVP)

## Summary
A local-first PWA that lets a user record where their time actually goes with near-zero friction: tap a time-type, optionally add a one-line note, press Enter to start a live timer. The session supports a *quick-pause* (for micro-interruptions that shouldn't count as focus) and a *long-press-to-end* gesture (deliberate, mis-tap-proof), then shows a session summary and rolls up into a daily record page. No accounts, no backend — all data lives on-device in IndexedDB, with the data layer structured so optional cloud sync can be added later without a rewrite.

## User Story
As a person who wants to understand my daily time allocation,
I want to start a timed session in one or two taps, pause it for short interruptions, and end it with a deliberate gesture,
So that I build an accurate, low-effort record of how I actually spend my time and can review it each day.

## Problem → Solution
**Current state:** Empty repository. Traditional time-management tools force upfront planning and complex schedules, creating friction that kills adoption.
**Desired state:** A frictionless "start-in-the-moment" tracker that captures real time spent (not planned), distinguishes focus time from micro-interruptions, and surfaces a clear daily picture — installed as a PWA, working fully offline.

## Metadata
- **Complexity**: Large (greenfield; ~42 files, 11 build tasks)
- **Source PRD**: N/A (free-form product concept)
- **PRD Phase**: N/A
- **Estimated Files**: ~42 (8 config/scaffold, 4 domain, 2 data, 4 hooks, ~16 components/routes, 3 styles, ~10 tests, PWA assets)
- **Decisions locked (from user)**:
  - **Platform**: Web — React + TypeScript + Vite, installable PWA
  - **Data**: Local-first (IndexedDB via Dexie), structured for optional future sync (no backend this phase)
  - **Scope**: Full MVP — core loop **+** daily record page

---

## UX Design

**Design direction (anti-template, per `web/design-quality.md`):** *"Quiet Focus"* — a calm, editorial, warm-paper light theme with deep ink text and six semantic per-category accent colors. The active-session screen is the hero: an oversized **tabular-numeral** clock in generous negative space, with the category accent as a subtle ambient wash. The long-press end is a *designed* progress-ring micro-interaction. This deliberately avoids the banned "gray-on-white + one accent" and "uniform card grid" patterns by using semantic color, strong scale contrast, and intentional spacing rhythm.

### Before
```
┌──────────────────────────────┐
│   (empty repository — no app) │
└──────────────────────────────┘
```

### After
```
HOME (/)                          ACTIVE (/active)                 SUMMARY (/summary/:id)
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│  你想记录什么？          │       │  工作                    │       │  ✓ 已记录                │
│                        │       │  backtesting execution  │       │  工作 · execution model  │
│ ┌────┐┌────┐┌────┐      │       │                        │       │                        │
│ │工作││学习││休息│  →    │  →    │      00:42:18           │  →    │  开始 14:05  结束 15:28  │
│ └────┘└────┘└────┘      │       │   (hero, tabular)       │       │  总跨度   1h 23m         │
│ ┌────┐┌────┐┌────┐      │       │                        │       │  专注     1h 14m         │
│ │运动││生活││其他│      │       │  [ 快速暂停 ]            │       │  暂停 3 次 · 共 9m        │
│ └────┘└────┘└────┘      │       │  (◠ 长按结束 ◠)         │       │  最长暂停 4m 10s         │
│                        │       │   progress ring fills   │       │  [ 完成 ] [ 查看今天 ]    │
└────────────────────────┘       └────────────────────────┘       └────────────────────────┘
   tap a type → inline note            DAILY (/day)
┌────────────────────────┐       ┌────────────────────────┐
│  工作：___________ [↵]  │       │  2026年5月26日   ‹ 今天 › │
│  [开始]                 │       │  09:10–10:25 学习 1h08 ⏸7m│
│  (Enter starts; note    │       │  10:40–12:05 工作 1h18 ⏸7m│
│   optional)             │       │  13:20–14:00 休息  40m    │
└────────────────────────┘       │  ── 今日汇总 ──          │
                                  │  工作 2h32 学习1h08 休息40m│
                                  │  暂停共 23m · 总跨度 5h15m │
                                  └────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Start tracking | — | Tap type → (optional note) → Enter/开始 | Note is optional; Enter on empty note still starts |
| Micro-interruption | — | Tap 快速暂停 → 继续 | No reason prompt; timestamps recorded |
| End session | — | Long-press 1.7s; ring fills; release early cancels | Mis-tap-proof + "completion ritual"; keyboard/SR fallback = confirm dialog |
| Reopen mid-session | — | App auto-routes to `/active`, timer correct | Elapsed recomputed from timestamps (survives reload/throttle) |
| Review day | — | `/day` timeline + per-category totals | Default = today; ‹ › to change day |

---

## Mandatory Reading

> This is a **greenfield** project. There is no prior code to mirror, so the "patterns" the implementation must follow are (a) the user's global rule files below, and (b) the canonical snippets defined in **Patterns to Mirror**. Read these before writing any code.

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `/Users/zhenwu/.claude/rules/web/coding-style.md` | all | **Authoritative** file org (feature folders, `hooks/`, `lib/`, `styles/tokens.css`), CSS custom-property tokens, compositor-friendly animation, semantic HTML, naming (PascalCase components, `use` hooks, kebab CSS) |
| P0 | `/Users/zhenwu/.claude/rules/common/coding-style.md` | all | Immutability (CRITICAL — never mutate; return new objects), many-small-files (<800 lines), explicit error handling, input validation at boundaries |
| P0 | `/Users/zhenwu/.claude/rules/web/design-quality.md` | all | Anti-template policy; the "Quiet Focus" direction must satisfy ≥4 required qualities and avoid banned patterns |
| P1 | `/Users/zhenwu/.claude/rules/web/testing.md` | all | Vitest+RTL unit/component, Playwright E2E + **visual regression at 320/768/1024/1440**, 80% coverage |
| P1 | `/Users/zhenwu/.claude/rules/web/performance.md` | all | CWV targets, bundle budget (landing <150kb JS gz), animate only transform/opacity/clip-path, font-display swap, dynamic import heavy libs |
| P1 | `/Users/zhenwu/.claude/rules/web/patterns.md` | all | URL-as-state (active tab/day in route), client-state tooling (Zustand) — note MVP uses Dexie-reactive state, see Notes |
| P2 | `/Users/zhenwu/.claude/rules/web/security.md` | all | CSP for production, no `dangerouslySetInnerHTML` on user note text (escape by default — React does this) |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| vite-plugin-pwa | https://vite-pwa-org.netlify.app/ | `VitePWA({ registerType:'autoUpdate', manifest:{…}, workbox:{ globPatterns, cleanupOutdatedCaches:true }, devOptions:{ enabled:true } })`. `devOptions.enabled` is required to test the SW in `vite dev`. |
| Dexie v4 typing | https://dexie.org/docs/Typescript | Use `EntityTable<Session,'id'>` for typed tables; typings ship with `dexie` (no `@types`). |
| Dexie reactivity | https://dexie.org/docs/dexie-react-hooks/useLiveQuery() | `useLiveQuery(querier, deps?)` re-renders on data change; **returns `undefined` while loading** — must handle. |
| Dexie versioning | https://dexie.org/docs/Version/Version | `db.version(n).stores({...})`; bump `n` + `.upgrade(tx=>…)` to migrate. New versions list only changed tables. |
| Dexie sync (future) | https://dexie.org/product (dexie-cloud-addon) | Sync wants **global string ids** (`@id`). → Use `crypto.randomUUID()` string PKs now, NOT `++id`, so sync can be added later. |
| react-router v7 | https://reactrouter.com/ | Data-router routes; `useNavigate`, `<Navigate replace>`, route params (`/summary/:id`, `/day/:date?`). |

```
KEY_INSIGHT: Dexie sync addon uses global string ids.
APPLIES_TO: data/db.ts schema + lib/id.ts.
GOTCHA: Choosing crypto.randomUUID() string PKs now (not auto-increment) is what makes "optional sync later" cheap. Do not use '++id'.

KEY_INSIGHT: useLiveQuery returns undefined while loading.
APPLIES_TO: hooks/useActiveSession.ts, hooks/useDailySessions.ts.
GOTCHA: Repository returns `null` for "no active session" so the hook can distinguish undefined(loading) vs null(none) vs Session(active).

KEY_INSIGHT: crypto.randomUUID() requires a secure context.
APPLIES_TO: lib/id.ts.
GOTCHA: Works on https + http://localhost (dev + installed PWA are fine). Provide a tiny fallback only if needed.
```

> No further external research needed — remaining patterns (React, Vite, Vitest, Playwright) are established and stable within knowledge cutoff.

---

## Patterns to Mirror

> Greenfield: these snippets are the **reference to establish**. All later code must be indistinguishable from these.

### NAMING_CONVENTION
```text
Components:  PascalCase file + export   → CategoryPicker.tsx → export function CategoryPicker()
Hooks:       use-prefix camelCase       → useActiveSession.ts → export function useActiveSession()
Domain/lib:  camelCase fns, PascalCase types → metrics.ts → export function activeMs(); types: interface Session
CSS:         co-located *.module.css, kebab-case classes → .category-tile, .timer-clock
Constants:   UPPER_SNAKE for tunables   → HOLD_DURATION_MS, TICK_INTERVAL_MS
Folders:     feature folders under components/ (category-picker/, timer/, summary/, daily/, ui/)
```

### IMMUTABILITY (CRITICAL — from common/coding-style.md)
```ts
// SOURCE: to establish — data/sessionRepository.ts
// WRONG: session.pauses.push(p); session.status = 'paused';
// CORRECT: build a new object, never mutate the stored one
const updated: Session = {
  ...session,
  pauses: [...session.pauses, { pausedAt: now, resumedAt: null }],
  status: 'paused',
  updatedAt: now,
};
await db.sessions.put(updated);
```

### ERROR_HANDLING — custom error base
```ts
// SOURCE: to establish — src/lib/errors.ts
export class AppError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class ActiveSessionExistsError extends AppError {
  constructor() { super('A session is already in progress.', 'ACTIVE_SESSION_EXISTS'); }
}
export class SessionNotFoundError extends AppError {
  constructor(id: string) { super(`Session not found: ${id}`, 'SESSION_NOT_FOUND'); }
}
// UI catches AppError and shows error.message; logs full context to console.error on failure.
```

### DOMAIN_PURE_FUNCTIONS — the testable core (no React, no Dexie)
```ts
// SOURCE: to establish — src/domain/metrics.ts
import type { Session } from './session';

/** Wall-clock span from start to end (or `now` if running). */
export function totalSpanMs(s: Session, now: number): number {
  return (s.endedAt ?? now) - s.startedAt;
}
/** Sum of all pause intervals (open pause counted up to `now`). */
export function totalPausedMs(s: Session, now: number): number {
  return s.pauses.reduce((sum, p) => sum + ((p.resumedAt ?? now) - p.pausedAt), 0);
}
/** Focus time = span − paused. Clamped at 0. Freezes automatically while paused. */
export function activeMs(s: Session, now: number): number {
  return Math.max(0, totalSpanMs(s, now) - totalPausedMs(s, now));
}
export function pauseCount(s: Session): number { return s.pauses.length; }
export function longestPauseMs(s: Session, now: number): number {
  return s.pauses.reduce((m, p) => Math.max(m, (p.resumedAt ?? now) - p.pausedAt), 0);
}
```

### REPOSITORY_PATTERN — all persistence behind one interface
```ts
// SOURCE: to establish — src/data/sessionRepository.ts
import { db } from './db';
import type { Session, CategoryId } from '../domain/session';
import { toDayKey } from '../domain/time';
import { newId } from '../lib/id';
import { ActiveSessionExistsError, SessionNotFoundError } from '../lib/errors';

export const sessionRepository = {
  /** Returns the active/paused session, or null if none (null != undefined-loading). */
  async getActive(): Promise<Session | null> {
    const s = await db.sessions.where('status').anyOf('active', 'paused').first();
    return s ?? null;
  },
  async start(categoryId: CategoryId, note: string): Promise<Session> {
    if (await this.getActive()) throw new ActiveSessionExistsError();
    const now = Date.now();
    const session: Session = {
      id: newId(), categoryId, note: note.trim(),
      startedAt: now, endedAt: null, pauses: [],
      status: 'active', dayKey: toDayKey(now),
      createdAt: now, updatedAt: now,
    };
    await db.sessions.add(session);
    return session;
  },
  async pause(id: string): Promise<void> {
    const s = await this.#require(id);
    if (s.status !== 'active') return;
    const now = Date.now();
    await db.sessions.put({ ...s, status: 'paused',
      pauses: [...s.pauses, { pausedAt: now, resumedAt: null }], updatedAt: now });
  },
  async resume(id: string): Promise<void> {
    const s = await this.#require(id);
    if (s.status !== 'paused') return;
    const now = Date.now();
    const pauses = s.pauses.map((p, i) =>
      i === s.pauses.length - 1 && p.resumedAt === null ? { ...p, resumedAt: now } : p);
    await db.sessions.put({ ...s, status: 'active', pauses, updatedAt: now });
  },
  async end(id: string): Promise<Session> {
    const s = await this.#require(id);
    const now = Date.now();
    const pauses = s.pauses.map((p) => (p.resumedAt === null ? { ...p, resumedAt: now } : p));
    const ended: Session = { ...s, pauses, status: 'completed', endedAt: now, updatedAt: now };
    await db.sessions.put(ended);
    return ended;
  },
  async getById(id: string): Promise<Session | null> { return (await db.sessions.get(id)) ?? null; },
  async listByDay(dayKey: string): Promise<Session[]> {
    return db.sessions.where('dayKey').equals(dayKey).sortBy('startedAt');
  },
  async #require(id: string): Promise<Session> {
    const s = await db.sessions.get(id);
    if (!s) throw new SessionNotFoundError(id);
    return s;
  },
};
```

### REACTIVE_HOOK — Dexie live query
```ts
// SOURCE: to establish — src/hooks/useActiveSession.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { sessionRepository } from '../data/sessionRepository';
// undefined = loading; null = none; Session = active/paused
export function useActiveSession() {
  return useLiveQuery(() => sessionRepository.getActive());
}
```

### TICK_HOOK — timestamp-derived clock (robust to throttling/reload)
```ts
// SOURCE: to establish — src/hooks/useNow.ts
import { useEffect, useState } from 'react';
export const TICK_INTERVAL_MS = 1000;
/** Re-renders every interval AND on tab refocus. Elapsed is ALWAYS derived from Date.now(),
 *  never accumulated — so backgrounding/throttling/reload can't drift the timer. */
export function useNow(intervalMs: number = TICK_INTERVAL_MS): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [intervalMs]);
  return now;
}
```

### LONG_PRESS_HOOK — pointer events + rAF progress
```ts
// SOURCE: to establish — src/hooks/useLongPress.ts
import { useCallback, useRef, useState } from 'react';
export const HOLD_DURATION_MS = 1700; // within product's 1.5–2s
export function useLongPress(onComplete: () => void, duration = HOLD_DURATION_MS) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);
  const fired = useRef(false);
  const loop = useCallback(() => {
    const p = Math.min(1, (performance.now() - start.current) / duration);
    setProgress(p);
    if (p >= 1) { if (!fired.current) { fired.current = true; onComplete(); } return; }
    raf.current = requestAnimationFrame(loop);
  }, [duration, onComplete]);
  const begin = useCallback(() => { fired.current = false; start.current = performance.now(); loop(); }, [loop]);
  const cancel = useCallback(() => { if (raf.current) cancelAnimationFrame(raf.current); setProgress(0); }, []);
  return {
    progress,
    handlers: {
      onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); begin(); },
      onPointerUp: cancel, onPointerLeave: cancel, onPointerCancel: cancel,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
  };
}
```

### COMPONENT_PATTERN — presentational, semantic, token-styled
```tsx
// SOURCE: to establish — src/components/timer/TimerDisplay.tsx
import styles from './timer.module.css';
import { activeMs } from '../../domain/metrics';
import { formatClock } from '../../domain/time';
import type { Session } from '../../domain/session';

export function TimerDisplay({ session, now }: { session: Session; now: number }) {
  return (
    <time className={styles.clock} aria-live="off" dateTime={`PT${Math.floor(activeMs(session, now) / 1000)}S`}>
      {formatClock(activeMs(session, now))}
    </time>
  );
}
```

### CSS_TOKENS — design system (establish in src/styles/tokens.css)
```css
:root {
  /* surfaces — warm paper */
  --color-bg: oklch(98.5% 0.006 95);
  --color-surface: oklch(100% 0 0);
  --color-surface-sunken: oklch(96% 0.006 95);
  --color-ink: oklch(22% 0.02 270);
  --color-ink-soft: oklch(46% 0.02 270);
  --color-ink-faint: oklch(64% 0.015 270);
  --color-hairline: oklch(90% 0.008 270);
  /* category accents — semantic, one per type */
  --cat-work: oklch(62% 0.16 250);
  --cat-study: oklch(64% 0.15 300);
  --cat-rest: oklch(72% 0.11 195);
  --cat-exercise: oklch(66% 0.17 35);
  --cat-chores: oklch(70% 0.13 135);
  --cat-other: oklch(60% 0.02 270);
  /* typography — 2 families max */
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-numeric: 'Geist Mono', 'SF Mono', ui-monospace, monospace;
  --text-sm: 0.9rem;
  --text-base: clamp(1rem, 0.94rem + 0.3vw, 1.125rem);
  --text-lg: 1.35rem;
  --text-xl: clamp(1.6rem, 1.2rem + 1.5vw, 2.2rem);
  --text-timer: clamp(3.5rem, 2rem + 12vw, 7rem);
  /* spacing rhythm */
  --space-1:.25rem; --space-2:.5rem; --space-3:.75rem; --space-4:1rem;
  --space-6:1.5rem; --space-8:2rem; --space-12:3rem;
  --space-section: clamp(2rem, 1.5rem + 3vw, 4rem);
  /* radius / depth */
  --radius-md:.875rem; --radius-lg:1.25rem; --radius-pill:999px;
  --shadow-sm: 0 1px 2px oklch(20% .02 270/.06), 0 1px 3px oklch(20% .02 270/.08);
  --shadow-md: 0 4px 16px oklch(20% .02 270/.10);
  /* motion */
  --duration-fast:150ms; --duration-normal:280ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  /* safe areas (PWA notch) */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
.timer-clock { font-family: var(--font-numeric); font-variant-numeric: tabular-nums; } /* no jitter */
```

### TEST_STRUCTURE — Vitest + fake-indexeddb
```ts
// SOURCE: to establish — src/domain/metrics.test.ts (pure, no setup)
import { describe, it, expect } from 'vitest';
import { activeMs, totalPausedMs } from './metrics';
import type { Session } from './session';
const base: Session = { id:'t', categoryId:'work', note:'', startedAt:0, endedAt:null,
  pauses:[], status:'active', dayKey:'1970-01-01', createdAt:0, updatedAt:0 };
describe('activeMs', () => {
  it('equals span when never paused', () => {
    expect(activeMs({ ...base, startedAt: 0 }, 60_000)).toBe(60_000);
  });
  it('freezes during an open pause', () => {
    const s = { ...base, pauses: [{ pausedAt: 30_000, resumedAt: null }] };
    expect(activeMs(s, 90_000)).toBe(30_000); // only the 30s before pause counts
  });
});

// SOURCE: to establish — src/data/sessionRepository.test.ts
import 'fake-indexeddb/auto'; // MUST be first import — provides IndexedDB in node
import { beforeEach, describe, it, expect } from 'vitest';
import { db } from './db';
import { sessionRepository } from './sessionRepository';
beforeEach(async () => { await db.sessions.clear(); });
describe('lifecycle', () => {
  it('rejects a second concurrent session', async () => {
    await sessionRepository.start('work', '');
    await expect(sessionRepository.start('study', '')).rejects.toThrow(/in progress/i);
  });
});
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `package.json` | CREATE | Deps + scripts (scaffold via `npm create vite@latest`) |
| `vite.config.ts` | CREATE | React plugin + VitePWA + Vitest config |
| `tsconfig.json` / `tsconfig.node.json` | CREATE | TS strict mode |
| `eslint.config.js` | CREATE | Lint (flat config) |
| `.prettierrc` / `.stylelintrc.json` | CREATE | Format + CSS lint (per `web/hooks.md`) |
| `playwright.config.ts` | CREATE | E2E + visual regression projects (320/768/1024/1440) |
| `index.html` | CREATE | App shell, theme-color, viewport-fit=cover, font preload |
| `public/manifest icons (192/512/maskable)` | CREATE | PWA install |
| `src/main.tsx` | CREATE | Bootstrap + router + import styles |
| `src/App.tsx` | CREATE | Route table + active-session redirect + layout |
| `src/styles/tokens.css` | CREATE | Design tokens (see snippet) |
| `src/styles/typography.css` | CREATE | Font faces, base type, tabular-nums |
| `src/styles/global.css` | CREATE | Reset, safe-area, base layout |
| `src/lib/id.ts` | CREATE | `newId()` → `crypto.randomUUID()` (sync-ready PK) |
| `src/lib/errors.ts` | CREATE | `AppError` + domain errors |
| `src/domain/session.ts` | CREATE | `Session`, `PauseInterval`, `CategoryId`, `SessionStatus` types |
| `src/domain/categories.ts` | CREATE | 6 category configs (id/label/icon/colorVar) |
| `src/domain/metrics.ts` | CREATE | Pure metric fns (span/paused/active/count/longest) |
| `src/domain/time.ts` | CREATE | `formatClock`, `formatHuman`, `formatTimeOfDay`, `toDayKey`, `summarizeDay` |
| `src/data/db.ts` | CREATE | Dexie instance + `EntityTable` schema v1 |
| `src/data/sessionRepository.ts` | CREATE | CRUD + lifecycle (see snippet) |
| `src/hooks/useNow.ts` | CREATE | Ticking clock (see snippet) |
| `src/hooks/useActiveSession.ts` | CREATE | Live active session |
| `src/hooks/useDailySessions.ts` | CREATE | Live sessions for a dayKey |
| `src/hooks/useLongPress.ts` | CREATE | Pointer + rAF long-press |
| `src/routes/HomeScreen.tsx` | CREATE | Type picker + note + start |
| `src/routes/ActiveSessionScreen.tsx` | CREATE | Timer + pause + long-press end |
| `src/routes/SummaryScreen.tsx` | CREATE | Post-session summary |
| `src/routes/DailyScreen.tsx` | CREATE | Daily timeline + totals + day nav |
| `src/components/category-picker/{CategoryPicker,CategoryTile,NoteForm}.tsx + .module.css` | CREATE | Home UI |
| `src/components/timer/{TimerDisplay,PauseButton,LongPressEndButton,ProgressRing}.tsx + timer.module.css` | CREATE | Active UI |
| `src/components/summary/SessionSummary.tsx + summary.module.css` | CREATE | Summary UI |
| `src/components/daily/{DailyTimeline,SessionRow,DailyTotals}.tsx + daily.module.css` | CREATE | Daily UI |
| `src/components/ui/{Button,CategoryBadge}.tsx + ui.module.css` | CREATE | Shared primitives |
| `src/test/setup.ts` | CREATE | Vitest + RTL + fake-indexeddb setup |
| `src/domain/*.test.ts`, `src/data/*.test.ts`, `src/hooks/*.test.ts`, `src/components/**/*.test.tsx` | CREATE | Unit/component tests (≥80%) |
| `tests/e2e/core-flow.spec.ts` | CREATE | Full-flow E2E + visual regression |

## NOT Building (explicit scope guard)
- ❌ Any backend, API, account, login, or real cloud sync (data layer is *structured* for it; not implemented)
- ❌ Mood rating, focus-level rating, tags, written reflection, goal-completion (explicitly "future" in concept)
- ❌ Editing/deleting a completed session from the UI (repository has methods; no UI this phase)
- ❌ Weekly/monthly analytics, charts, trends (daily page only)
- ❌ Notifications, reminders, background timers beyond timestamp-derived elapsed
- ❌ Dark theme (light "Quiet Focus" only; tokens make it addable later)
- ❌ Custom user-defined categories (fixed 6; "其他" covers ad-hoc)
- ❌ Full i18n framework (Chinese strings centralized in `categories.ts`/components; no locale switching)
- ❌ Cross-midnight session splitting (session attributed to `startedAt`'s day — see Risks)

---

## Step-by-Step Tasks

### Task 1: Scaffold project + tooling + PWA + design tokens
- **ACTION**: Initialize Vite React-TS app in repo root, add deps, configs, PWA, and the styles system.
- **IMPLEMENT**:
  - `npm create vite@latest . -- --template react-ts` (root is empty; safe).
  - Runtime deps: `dexie dexie-react-hooks react-router-dom`. Dev deps: `vite-plugin-pwa vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom fake-indexeddb @playwright/test eslint prettier stylelint stylelint-config-standard`.
  - `vite.config.ts`: `react()` + `VitePWA({ registerType:'autoUpdate', manifest:{ name:'Timebox', short_name:'Timebox', description:'轻量化时间记录', theme_color:'#fbfbf7', background_color:'#fbfbf7', display:'standalone', orientation:'portrait', icons:[192,512,maskable] }, workbox:{ globPatterns:['**/*.{js,css,html,svg,png,woff2}'], cleanupOutdatedCaches:true }, devOptions:{ enabled:true } })`. Add `test:{ globals:true, environment:'jsdom', setupFiles:'./src/test/setup.ts', coverage:{ provider:'v8', thresholds:{ lines:80, functions:80, branches:80, statements:80 } } }`.
  - `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, `<meta name="theme-color" content="#fbfbf7">`, preload primary font weight only.
  - Create `src/styles/{tokens,typography,global}.css` (tokens per **CSS_TOKENS** snippet); import all in `main.tsx`.
  - `package.json` scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `typecheck` (`tsc --noEmit`), `lint`, `test` (`vitest run`), `test:coverage` (`vitest run --coverage`), `test:e2e` (`playwright test`).
- **MIRROR**: File org + tokens from `web/coding-style.md`; bundle/animation rules from `web/performance.md`.
- **IMPORTS**: n/a (config).
- **GOTCHA**: `devOptions.enabled:true` is required to exercise the service worker in `vite dev`. Generate maskable icon (safe zone) or install will warn. Keep to **2 font families max** (`web/performance.md`).
- **VALIDATE**: `npm run dev` serves; `npm run build` emits `dist/` + `sw.js` + `manifest.webmanifest`; `npm run typecheck` clean.

### Task 2: Domain types + categories (no logic yet)
- **ACTION**: Define the data shapes and category config — the contract everything depends on.
- **IMPLEMENT**:
  - `src/domain/session.ts`: `type CategoryId = 'work'|'study'|'rest'|'exercise'|'chores'|'other'`; `type SessionStatus = 'active'|'paused'|'completed'`; `interface PauseInterval { pausedAt:number; resumedAt:number|null }`; `interface Session { id:string; categoryId:CategoryId; note:string; startedAt:number; endedAt:number|null; pauses:PauseInterval[]; status:SessionStatus; dayKey:string; createdAt:number; updatedAt:number }`.
  - `src/domain/categories.ts`: `interface Category { id:CategoryId; label:string; hint:string; icon:string; colorVar:string }` and `export const CATEGORIES: readonly Category[]` for work(工作)/study(学习)/rest(休息)/exercise(运动)/chores(生活事务)/other(其他), `colorVar:'--cat-work'` etc., `icon` = emoji or inline-svg name, `hint` = example uses from concept. Add `getCategory(id)` lookup.
- **MIRROR**: NAMING_CONVENTION; immutable `readonly` data.
- **IMPORTS**: none (leaf module).
- **GOTCHA**: Timestamps are **epoch ms numbers** (sync/serialization-friendly), never `Date` objects in the model. `note` is always a string (`''`, never null/undefined).
- **VALIDATE**: `npm run typecheck` clean; import compiles.

### Task 3: Pure metrics + time formatting + TESTS FIRST (TDD)
- **ACTION**: Implement the testable core. Per `common/testing.md`, write tests first (RED→GREEN).
- **IMPLEMENT**:
  - `src/domain/metrics.ts`: per **DOMAIN_PURE_FUNCTIONS** snippet (`totalSpanMs`, `totalPausedMs`, `activeMs`, `pauseCount`, `longestPauseMs`).
  - `src/domain/time.ts`: `formatClock(ms)`→`HH:MM:SS` (zero-pad, hours grow); `formatHuman(ms)`→`1h 14m` / `40m` / `8m 32s` / `0m`; `formatTimeOfDay(epochMs)`→`14:05` (local, 24h, zero-pad); `toDayKey(epochMs)`→`YYYY-MM-DD` (LOCAL date, not UTC); `summarizeDay(sessions, now)`→`{ byCategory: Partial<Record<CategoryId,number>>; pausedTotalMs:number; spanTotalMs:number }` (sum `activeMs` per category over completed sessions; `pausedTotalMs`=Σ`totalPausedMs`; `spanTotalMs`=Σ`totalSpanMs`).
  - Tests: `metrics.test.ts`, `time.test.ts` (see **TEST_STRUCTURE**).
- **MIRROR**: DOMAIN_PURE_FUNCTIONS, TEST_STRUCTURE.
- **IMPORTS**: `import type { Session, CategoryId } from './session'`.
- **GOTCHA**: `toDayKey` must use **local** date parts (`d.getFullYear()/getMonth()+1/getDate()`), NOT `toISOString()` (which is UTC and shifts the day). `formatClock` must handle ≥1h (e.g. `01:02:03`) and 0 (`00:00:00`). `activeMs` clamps at 0 (clock skew safety).
- **VALIDATE**: `npm run test -- src/domain` all green; cover empty pauses, open pause, multiple pauses, end-while-paused, midnight boundary, <1min, >1h.

### Task 4: Data layer — Dexie db + repository + TESTS
- **ACTION**: Implement persistence behind the repository interface.
- **IMPLEMENT**:
  - `src/lib/id.ts`: `export const newId = () => crypto.randomUUID();`
  - `src/lib/errors.ts`: per **ERROR_HANDLING** snippet.
  - `src/data/db.ts`: `import Dexie, { type EntityTable } from 'dexie'`; `const db = new Dexie('timebox') as Dexie & { sessions: EntityTable<Session,'id'> }`; `db.version(1).stores({ sessions: 'id, status, dayKey, startedAt, categoryId' })`; `export { db }`.
  - `src/data/sessionRepository.ts`: per **REPOSITORY_PATTERN** snippet.
  - `src/data/sessionRepository.test.ts`: `import 'fake-indexeddb/auto'` first; cover start→pause→resume→end lifecycle, single-active guard, end-while-paused closes open pause, `listByDay` ordering, `getActive` null vs session.
- **MIRROR**: REPOSITORY_PATTERN, IMMUTABILITY, ERROR_HANDLING, TEST_STRUCTURE.
- **IMPORTS**: `Dexie, { EntityTable }` from `dexie`; domain types/time/id/errors.
- **GOTCHA**: PK is `'id'` string (NOT `'++id'`) — required for future Dexie-Cloud sync. `where('status').anyOf('active','paused')` requires `status` to be indexed (it is, in schema). Every write goes through `{ ...s, …, updatedAt: now }` (immutability). `fake-indexeddb/auto` import MUST precede `./db`.
- **VALIDATE**: `npm run test -- src/data` green.

### Task 5: React hooks (reactivity + timer + long-press)
- **ACTION**: Build the hooks bridging data/runtime to UI.
- **IMPLEMENT**:
  - `src/hooks/useNow.ts` (TICK_HOOK snippet), `src/hooks/useActiveSession.ts` (REACTIVE_HOOK snippet), `src/hooks/useDailySessions.ts` (`useLiveQuery(()=>sessionRepository.listByDay(dayKey),[dayKey])`), `src/hooks/useLongPress.ts` (LONG_PRESS_HOOK snippet).
  - Tests: `useNow.test.ts` (fake timers advance → value changes), `useLongPress.test.ts` (mock `performance.now` + `requestAnimationFrame`; assert `onComplete` fires once at duration, cancel resets progress to 0 and prevents fire).
- **MIRROR**: TICK_HOOK, LONG_PRESS_HOOK, REACTIVE_HOOK.
- **IMPORTS**: `useLiveQuery` from `dexie-react-hooks`; `sessionRepository`.
- **GOTCHA**: `useLiveQuery` returns `undefined` while loading — consumers must treat `undefined`=loading, `null`=none. In `useLongPress`, guard `onComplete` with a `fired` ref so it never double-fires, and use `performance.now()` (monotonic) not `Date.now()`.
- **VALIDATE**: `npm run test -- src/hooks` green.

### Task 6: Home screen — category picker + optional note + start
- **ACTION**: Build the entry flow: tap type → inline note → Enter/开始 starts a session.
- **IMPLEMENT**:
  - `CategoryPicker.tsx`: maps `CATEGORIES` → `CategoryTile` grid (semantic `<ul>`/`<button>`). On select, set `selectedId` (local `useState`).
  - `CategoryTile.tsx`: `<button>` with icon + label + hint; selected state uses `--cat-*` accent; designed hover/focus/active states.
  - `NoteForm.tsx`: shown after selection — `工作：[input] [↵]`; `<form onSubmit>` → `sessionRepository.start(id, note)` → `navigate('/active')`. Autofocus input; Enter submits even when empty; visible **开始** button (a11y/non-keyboard). A "‹ 重选" clears selection.
  - `HomeScreen.tsx` composes picker + (conditional) note form.
- **MIRROR**: COMPONENT_PATTERN; semantic-HTML + naming + CSS-tokens from `web/coding-style.md`; design-quality (hover/focus/active, scale contrast).
- **IMPORTS**: `useNavigate` (react-router), `CATEGORIES`, `sessionRepository`.
- **GOTCHA**: `start()` can throw `ActiveSessionExistsError` (race) — catch and route to `/active` instead of crashing. Trim note but allow empty. `autoFocus` + mobile keyboard "Go" = submit.
- **VALIDATE**: `CategoryPicker.test.tsx` — renders 6 tiles, selecting reveals NoteForm, submit calls `start`; manual: tap 工作 → Enter → lands on `/active`.

### Task 7: Active session screen — timer + quick-pause + long-press end
- **ACTION**: The hero screen: live timer, pause/resume, long-press-to-end with progress ring.
- **IMPLEMENT**:
  - `TimerDisplay.tsx` (COMPONENT_PATTERN): big tabular clock = `formatClock(activeMs(session, now))`; `now` from `useNow()`.
  - `PauseButton.tsx`: toggles `pause`/`resume` via repository by `session.status`. When paused, screen shows "已暂停" + current pause counting up + total paused.
  - `ProgressRing.tsx`: SVG `<circle>`, `strokeDashoffset = C*(1-progress)`, `C=2πr`; accent color; `aria-hidden`.
  - `LongPressEndButton.tsx`: wraps `useLongPress(onEnd)`; spreads `handlers` on a `<button>`; renders `ProgressRing progress`. `onEnd` = `await sessionRepository.end(id)` → `navigate('/summary/'+id)`. Provide keyboard/SR fallback: `onClick` (non-press) opens a `confirm('结束当前 session？')`; `aria-label="长按结束（或点击确认结束）"`.
  - `ActiveSessionScreen.tsx`: reads `useActiveSession()`; if `null` → `<Navigate to="/" replace>`; if `undefined` → loading; shows category badge + note + TimerDisplay + PauseButton + LongPressEndButton; ambient `--cat-*` wash by category.
- **MIRROR**: TICK_HOOK, LONG_PRESS_HOOK, COMPONENT_PATTERN; `web/performance.md` (animate `transform`/`opacity`; ring `stroke-dashoffset` acceptable for a 1.7s gesture but keep `will-change` narrow).
- **IMPORTS**: hooks, `sessionRepository`, `metrics`, `time`, `getCategory`, `Navigate`/`useNavigate`.
- **GOTCHA**: `touch-action:none` + `user-select:none` on the end button (prevent scroll/selection during hold); `e.preventDefault()` on pointerdown; `onContextMenu` preventDefault (mobile long-press menu). Optional `navigator.vibrate?.(30)` on complete — **iOS Safari ignores vibrate** (don't depend on it). Honor `prefers-reduced-motion`. Don't fire `end` twice (hook `fired` ref).
- **VALIDATE**: `LongPressEndButton.test.tsx` — onComplete after `HOLD_DURATION_MS`, cancel resets; manual: start → watch tick → pause/resume (clock freezes/resumes) → long-press → summary.

### Task 8: Session summary screen
- **ACTION**: Show the completed session's key metrics.
- **IMPLEMENT**:
  - `SessionSummary.tsx`: given a `Session`, render category+note, `开始 formatTimeOfDay(startedAt)`, `结束 formatTimeOfDay(endedAt)`, `总跨度 formatHuman(totalSpanMs)`, `专注 formatHuman(activeMs)`, `暂停 {pauseCount} 次 · 共 formatHuman(totalPausedMs)`, `最长暂停 formatHuman(longestPauseMs)`, `记录于 {date}`. For a completed session pass `now=endedAt`.
  - `SummaryScreen.tsx`: `useParams id` → `sessionRepository.getById` (live or one-shot); buttons **完成**→`/` and **查看今天**→`/day`.
- **MIRROR**: COMPONENT_PATTERN; design-quality hierarchy (scale contrast for the headline metric = 专注时长).
- **IMPORTS**: metrics, time, `useParams`, `useNavigate`.
- **GOTCHA**: A completed session's metrics must use `now = endedAt` (not live `Date.now()`), else they'd keep growing. Handle missing id → redirect `/`.
- **VALIDATE**: `SessionSummary.test.tsx` renders all fields for a fixture; manual end → summary correct.

### Task 9: Daily record screen — timeline + totals + day nav
- **ACTION**: List a day's sessions and per-category rollup.
- **IMPLEMENT**:
  - `SessionRow.tsx`: `formatTimeOfDay(start)–formatTimeOfDay(end)` · category badge · note · `formatHuman(activeMs)` · `⏸ formatHuman(totalPausedMs)`. Active/paused row shows "进行中" with live `useNow`.
  - `DailyTotals.tsx`: from `summarizeDay(sessions, now)` render per-category totals (only present categories), `暂停共`, `总跨度`.
  - `DailyTimeline.tsx`: ordered rows (already sorted by `startedAt`); empty state ("今天还没有记录").
  - `DailyScreen.tsx`: `useParams date?` (default today `toDayKey(Date.now())`); `useDailySessions(dayKey)`; header with ‹ 前一天 / 今天 / 后一天 › updating route `/day/:date`.
- **MIRROR**: COMPONENT_PATTERN; URL-as-state (`web/patterns.md`) — selected day in route.
- **IMPORTS**: `useDailySessions`, `summarizeDay`, time, `getCategory`, `useParams`/`useNavigate`.
- **GOTCHA**: `useLiveQuery` `undefined`=loading → show skeleton, not "empty". Day math via dayKey strings — add a `addDays(dayKey, n)` helper in `time.ts` (parse local, not UTC). Don't let "后一天" go past today (optional clamp).
- **VALIDATE**: `DailyTotals.test.tsx` aggregates a fixture correctly; manual: complete 2 sessions → both appear, totals correct.

### Task 10: App shell, routing, resume-on-load, PWA polish
- **ACTION**: Wire routes, layout, and the "reopen mid-session" behavior; finalize installability.
- **IMPLEMENT**:
  - `App.tsx`: routes `/`(Home), `/active`, `/summary/:id`, `/day` & `/day/:date`. A top-level effect: if `useActiveSession()` is a Session and `location.pathname==='/'`, `navigate('/active', { replace:true })` (resume on reopen).
  - Layout: max-width mobile column centered, `padding-top:var(--safe-top)` / `padding-bottom:var(--safe-bottom)`; minimal top bar.
  - `main.tsx`: `<BrowserRouter>` + import styles. Confirm `vite-plugin-pwa` auto-registers SW (`registerType:'autoUpdate'`).
  - Generate icons (192, 512, 512-maskable) into `public/`.
- **MIRROR**: `web/coding-style.md` semantic HTML (`<header>/<main>`); `web/performance.md` (no layout-shift; explicit icon sizes).
- **IMPORTS**: router APIs, `useActiveSession`.
- **GOTCHA**: Redirect logic must not loop (`/active`→`/` when none, `/`→`/active` when one): gate the Home→active redirect on `pathname==='/'` only and use `replace`. `viewport-fit=cover` + safe-area padding needed or content hides under the notch in standalone mode.
- **VALIDATE**: `npm run build && npm run preview`; Chrome DevTools → Application: manifest valid, SW active, installable; reload mid-session resumes `/active` with correct elapsed.

### Task 11: E2E + visual regression (Playwright)
- **ACTION**: Cover the critical flow end-to-end and snapshot key breakpoints.
- **IMPLEMENT**:
  - `playwright.config.ts`: `webServer` runs `npm run preview` (built app, so SW/PWA realistic); projects/viewports 320, 768, 1024, 1440 (per `web/testing.md`); `expect.toHaveScreenshot`.
  - `tests/e2e/core-flow.spec.ts`: open `/` → assert 6 categories → click 工作 → type note → Enter → `/active` shows running clock (assert it increments) → click 快速暂停 → assert "已暂停" + clock frozen → 继续 → long-press end button (`page.mouse.down`, wait `HOLD_DURATION_MS`, `up`) → `/summary/:id` shows 专注/暂停 metrics → 查看今天 → `/day` shows the session + totals. Screenshot home, active, summary, day at each breakpoint.
  - Reduced-motion + keyboard pass: tab to category, Enter; verify long-press fallback confirm path.
- **MIRROR**: `web/testing.md` E2E shape + visual-regression priority; deterministic waits (no arbitrary sleeps except the intentional hold).
- **IMPORTS**: `@playwright/test`.
- **GOTCHA**: IndexedDB persists across tests in one context — start each test with a fresh context or clear DB (`page.evaluate(()=>indexedDB.deleteDatabase('timebox'))` in `beforeEach`). The long-press needs a real hold duration; use `page.waitForTimeout(HOLD_DURATION_MS+150)` between mouse down/up (this is the one legitimate timed wait). First screenshot run creates baselines — commit them.
- **VALIDATE**: `npm run test:e2e` green; baseline screenshots committed.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `activeMs` no pauses | start 0, now 60s | 60_000 | base |
| `activeMs` open pause | pause at 30s, now 90s | 30_000 (frozen) | ✅ open pause |
| `activeMs` resumed | pause 30–50s, now 90s | 70_000 | ✅ closed pause |
| `totalPausedMs` multi | two pauses 5s+3s | 8_000 | ✅ multiple |
| `longestPauseMs` | pauses 5s,12s,3s | 12_000 | ✅ |
| `activeMs` clamp | endedAt < startedAt (skew) | 0 | ✅ clamp |
| `formatClock` | 3_723_000 | `01:02:03` | ✅ ≥1h |
| `formatClock` zero | 0 | `00:00:00` | ✅ |
| `formatHuman` | 44_000 | `44s` / `0m`? define: `<1m`→`{s}s` | ✅ sub-minute |
| `toDayKey` local midnight | 23:30 local | today's key (not UTC next day) | ✅ tz |
| `summarizeDay` | 3 sessions 2 cats | byCategory sums + span + paused | ✅ rollup |
| repo single-active | start twice | 2nd throws `ActiveSessionExistsError` | ✅ guard |
| repo end-while-paused | end during open pause | open pause closed at endedAt | ✅ |
| repo `listByDay` order | unsorted inserts | sorted by `startedAt` | ✅ |
| `useLongPress` | hold ≥ duration | `onComplete` once | ✅ |
| `useLongPress` cancel | release < duration | progress→0, no fire | ✅ |
| CategoryPicker | render+select+submit | `start` called with id+note | component |
| SessionSummary | completed fixture | all metric fields present | component |
| DailyTotals | day fixture | correct per-category totals | component |

### Edge Cases Checklist
- [ ] Empty note (start with no text) → session starts, note `''`
- [ ] App reload mid-session → resumes `/active`, elapsed correct (timestamp-derived)
- [ ] Tab backgrounded for minutes → on return, clock jumps to correct value (no drift)
- [ ] End while paused → open pause closed; metrics consistent
- [ ] Multiple rapid pause/resume → pauses array consistent, immutable updates
- [ ] Long-press release at 90% → no end, ring resets
- [ ] Second session attempt while one active → guarded
- [ ] Day with zero sessions → empty-state, not crash
- [ ] Session crossing midnight → attributed to start day (documented limitation)
- [ ] `prefers-reduced-motion` → ring/transitions reduced; long-press still works
- [ ] Keyboard-only / screen reader → category select + start + end-fallback reachable

---

## Validation Commands

### Static Analysis
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint . ; stylelint "src/**/*.css"
```
EXPECT: Zero type errors, zero lint errors.

### Unit / Component Tests
```bash
npm run test
```
EXPECT: All pass.

### Coverage
```bash
npm run test:coverage
```
EXPECT: lines/functions/branches/statements ≥ 80% (domain + data near 100%).

### Build (verifies PWA)
```bash
npm run build
```
EXPECT: `dist/` with `sw.js` + `manifest.webmanifest`; no type errors.

### E2E + Visual Regression
```bash
npx playwright install --with-deps   # first time
npm run test:e2e
```
EXPECT: Core flow passes at 320/768/1024/1440; screenshots match baselines.

### Manual Validation
- [ ] `npm run preview` → install as PWA (Chrome: Install app); launches standalone
- [ ] Offline (DevTools → Network: Offline) → app still loads and tracks
- [ ] Start 工作 + note → timer ticks → pause (freezes) → resume → long-press end → summary correct → 查看今天 shows it + totals
- [ ] Reload during active session → lands on running timer with correct elapsed
- [ ] Notch device / responsive mode → no content under status bar (safe-area)

---

## Acceptance Criteria
- [ ] All 11 tasks completed
- [ ] All validation commands pass
- [ ] Tests written and passing; coverage ≥ 80%
- [ ] No type errors, no lint errors
- [ ] PWA installable + works offline
- [ ] Matches "Quiet Focus" UX design and the before/after flows
- [ ] Full loop works: pick type → (note) → timer → quick-pause → long-press end → summary → daily page

## Completion Checklist
- [ ] Code follows the established patterns (naming, immutability, repository, hooks, tokens)
- [ ] Error handling uses `AppError` subclasses; no silently-swallowed errors
- [ ] Timer is timestamp-derived (no drift; survives reload/throttle)
- [ ] Tests follow Vitest/RTL/Playwright patterns; visual baselines committed
- [ ] No hardcoded magic numbers (use `HOLD_DURATION_MS`, `TICK_INTERVAL_MS`, tokens)
- [ ] Data layer uses string UUID PKs (sync-ready); no `++id`
- [ ] Files <800 lines, feature-folder organization
- [ ] No out-of-scope additions (see NOT Building)
- [ ] Self-contained — implementable from this plan without further searching

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Timer drift / throttling when tab backgrounded | High (if done naively) | High | **Timestamp-derived elapsed** (never accumulate); `visibilitychange` refresh — baked into `useNow`/metrics |
| Long-press conflicts with mobile text-select/context menu/scroll | Med | Med | `touch-action:none`, `user-select:none`, `preventDefault` on pointerdown + `onContextMenu` |
| Long-press inaccessible to keyboard/SR users | Med | Med | Click-fallback confirm dialog + `aria-label`; covered in E2E a11y pass |
| `toDayKey` UTC bug shifts sessions to wrong day | Med | High | Use **local** date parts, never `toISOString()`; explicit tz test |
| Cross-midnight sessions mis-attributed | Low | Low | Documented: attributed to start day (NOT building split) |
| `useLiveQuery` `undefined` mistaken for "empty" | Med | Med | Repository returns `null` for none; hooks/UI distinguish loading vs empty |
| iOS Safari PWA quirks (vibrate ignored, install via Share sheet, safe-area) | Med | Low | Don't depend on vibrate; `viewport-fit=cover`+safe-area; document iOS install |
| Visual-regression flakiness (fonts/AA) | Med | Low | Preview build server, fixed viewports, fixed system fonts, generous `maxDiffPixels` |
| crypto.randomUUID in insecure context | Low | Med | Only http://localhost + https used; tiny fallback if ever served over plain http |

## Notes
- **Why no global store (Zustand) in MVP:** `web/patterns.md` lists Zustand for client state, but here the canonical app state (active session, daily sessions) is **persisted and reactive via Dexie `useLiveQuery`**, and timer "now" is derived via `useNow`. Adding a global store would duplicate server-of-record state (anti-pattern: "do not duplicate state"). If genuine cross-cutting client-only state appears later, introduce Zustand then.
- **Why string UUID PKs:** This is the single decision that makes the user's "optional sync later" choice cheap — `dexie-cloud-addon` expects global ids. Auto-increment (`++id`) would force a migration later.
- **Timer truth model:** The 1s tick only forces re-render; elapsed is *always* `activeMs(session, Date.now())`. This is the core robustness decision and must not be "optimized" into an accumulator.
- **Metric definitions (authoritative, since the concept's example numbers are illustrative/inconsistent):** `专注/active = span − paused`; `总跨度/span = (endedAt|now) − startedAt`; daily `总跨度 = Σ span`, daily `暂停 = Σ paused`, per-category total = `Σ active`.
- **i18n:** UI strings are Chinese, centralized in `categories.ts` + components. No locale framework (out of scope) but strings are not scattered, so adding i18n later is mechanical.
- **Future sync path (not now):** add `dexie-cloud-addon`, switch ids to `@id`, add auth — data shapes already compatible.
```
