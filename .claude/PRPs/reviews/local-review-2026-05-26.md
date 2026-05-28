# Local Code Review — Timebox UI phase

**Reviewed**: 2026-05-26
**Scope**: Uncommitted changes (the UI phase) on top of commit `d86a79f "basic function"`
**Decision**: ✅ **APPROVE with comments** — 0 CRITICAL, 0 HIGH, 3 MEDIUM, 4 LOW

## Summary
The UI phase (Home, Active, Summary, Daily, routing, PWA, E2E) is clean, idiomatic, and well-tested. No security issues, no `any`, no `console.*`, no `innerHTML`, no TODO/FIXME. Validation is fully green. Findings are robustness/UX refinements, none blocking.

## Findings

### CRITICAL
None. (Local-first; no secrets, no network, no SQL; React escapes the note text; route params feed Dexie key lookups, not queries.)

### HIGH
None. Happy-path flows are covered by green unit + E2E tests.

### MEDIUM
- **M1 — Unvalidated `:date` route param** (`src/routes/DailyScreen.tsx`, `dayKey = date ?? today`, `formatDayLabel`, `addDays`).
  A hand-typed/garbage URL like `/day/foo` renders **"NaN年NaN月NaN日"** and the ‹ › buttons navigate to `NaN-NaN-NaN`. `useDailySessions` safely returns empty, so it's not a crash — but it's untrusted input crossing a boundary without validation (against the project's input-validation rule).
  **Fix**: add an `isDayKey(s)` guard in `domain/time.ts` (regex `^\d{4}-\d{2}-\d{2}$` + real-date check) and fall back to `today` when invalid.

- **M2 — `useLongPress` doesn't cancel its rAF on unmount** (`src/hooks/useLongPress.ts`).
  If the host unmounts mid-hold for any reason other than completion, the `requestAnimationFrame` loop keeps scheduling until `duration` elapses and then fires `onComplete` on a gone component (in the worst case ending a session unexpectedly). React 19 suppresses the setState-after-unmount warning, so it's silent. Low probability (the only in-app trigger is completion, which stops cleanly), but it's a real leak.
  **Fix**: `useEffect(() => stop, [stop])` so the frame is cancelled on unmount.

- **M3 — No entry point to the Daily record page from Home** (`src/routes/HomeScreen.tsx`).
  The daily review is a core part of the product concept, but `/day` is only reachable via the post-session summary's “查看今天” or by typing the URL. Consider a persistent “查看今天的记录” link on Home.
  **Fix**: add a small link/button on `HomeScreen` (and/or a header) routing to `/day`. (Product decision.)

### LOW
- **L1 — Dead CSS token** `--hold-duration` in `src/styles/tokens.css` is never consumed (the ring is driven by the JS `HOLD_DURATION_MS`). Remove it or wire the CSS to it.
- **L2 — No route-based code splitting**: single ~111 KB gz chunk. Under the 150 KB budget, so optional; `React.lazy` per route would trim initial JS.
- **L3 — `window.confirm` fallback** in `LongPressEndButton` is a crude (but accessible) keyboard/AT path. Acceptable for MVP; a styled dialog would be nicer.
- **L4 — In-progress session shows in the daily timeline but not in totals** (by design: `summarizeDay` counts only completed). Minor inconsistency worth a code comment.

## Positives
- Timestamp-derived timer (drift-proof); immutable repository writes; clean repository + pure-domain split.
- `react-hooks/immutability` + `purity` compliant; strict TS; semantic HTML; design-token system.
- Long-press has a genuine keyboard/AT fallback; reduced-motion respected.
- 70 unit tests + Playwright functional & visual-regression; ~99% statement coverage.

## Validation Results
(Re-confirmed in the immediately preceding step; no source changed since.)

| Check | Result |
|---|---|
| Type check (`tsc -b`, strict) | ✅ Pass |
| Lint (eslint) | ✅ Pass (0/0) |
| Unit tests (vitest) | ✅ Pass (70) |
| Coverage | ✅ 99.5% stmts (≥80%) |
| Build (vite + PWA) | ✅ Pass |
| E2E + visual regression (Playwright) | ✅ Pass (2) |

## Files Reviewed (uncommitted UI phase)
Modified: `src/App.tsx`, `src/main.tsx`, `vite.config.ts`, `package.json`, `public/favicon.svg` (+ deleted `public/icons.svg`).
Added: `src/components/{category-picker,timer,summary,daily,ui}/**`, `src/routes/**`, `src/test/setup.ts`, `playwright.config.ts`, `tests/e2e/core-flow.spec.ts`, `scripts/generate-icons.mjs`, `public/pwa-*.png`.
