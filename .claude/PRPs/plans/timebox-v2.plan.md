# Plan: TimeBox v2 — Full User Loop (Retention & Session Initiation)

## Status (2026-07-06)

- ✅ **Phase 1 shipped** — commit `327e1c9` · report `../reports/timebox-v2-phase1-report.md`
- ✅ **Phase 2 shipped** — commit `2629641` · report `../reports/timebox-v2-phase2-report.md`
- ✅ **Phase 3 shipped** — commit `b7cf871` (+ "Still drifting?" prompt follow-up) · report `../reports/timebox-v2-phase3-report.md`
- ⏳ **Phase 4** — direction only (native wrapper); not scheduled
- CI watcher on GitHub Actions: typecheck / lint / unit+coverage / build / e2e per push & PR

## Summary

The MVP timer works. v2 targets the full loop **Open App → Start Session → Stay Engaged → Complete Session → Continue Using App**, per the "TimeBox Next Version – Developer Feature Specification". This plan maps the spec's 17 features onto the existing codebase (React 19 + TS + Vite PWA, Dexie/IndexedDB local-first, react-router 7, zh/en i18n, Vitest + Playwright) and sequences them into 4 phases. The spec is treated as an idea collection: a few items are re-ordered or trimmed where they conflict with the current architecture or with web-platform reality (noted in **Key Decisions**).

## Current State (what exists)

- **Domain** (`src/domain/`): `Session` (id, categoryId, note, startedAt, endedAt, pauses[], status, dayKey), closed `CategoryId` union of 6 static categories with emoji + CSS color var, derived metrics (span/paused/active), day-key + formatting helpers.
- **Data** (`src/data/`): Dexie v1, single `sessions` table (string UUID PK, indexes: status, dayKey, startedAt, categoryId). All writes via `sessionRepository` (start/pause/resume/end, single-active invariant).
- **UI** (`src/routes/`, `src/components/`): Home = category picker → optional note → start. `/active` full-screen timer (accent wash, quick-pause, long-press end). `/summary/:id` metrics + Done/View Today. `/day/:date` timeline + totals. Nav shell with Track/Today tabs.
- **Infra**: PWA (autoUpdate SW), i18n compile-checked (zh/en), Vitest 80% coverage thresholds, Playwright e2e + screenshot snapshots, Cloudflare static deploy.

## Key Decisions (adjustments to the spec)

1. **Categories stay a closed union in v2.** Spec §7's `Category {id, name, color, usage_count, last_used}` suggests DB-backed categories. `CategoryId` is a compile-checked union used across domain/i18n/CSS; making it dynamic is invasive and the spec only asks for better cards, recents, favorites, quick start. → Add a small `categoryStats` table (keyed by existing ids: `usageCount`, `lastUsedAt`, `favorite`) and keep the union. User-defined categories = open question for v3.
2. **Drift is a session type, not a new engine.** `Session.type: 'standard' | 'drift'` (Dexie migration, backfill `'standard'`). Drift reuses timer, pause, summary, and daily rollup for free. Matches spec Group 9's recommended structure.
3. **Check-ins are a separate table with their own single-open invariant**, independent of sessions (they're passive labels like "Lunch", no pause machinery). Whether an open check-in may overlap a running session is an open question; v2 default: **allowed** (no cross-type enforcement).
4. **Web notification honesty (spec §2).** A pure client-side PWA cannot reliably fire scheduled notifications while closed: Notification Triggers API is unshipped and Web Push needs a server. → v2 ships: permission flow, notification prefs, in-app nudges, and best-effort local notifications while the app/SW is alive. Reliable scheduled reminders move to Phase 4 (native wrapper) or a future push backend. Do not promise "9:00 AM reminder" in UI copy until then.
5. **Homepage State A lists Check In / Drift CTAs (spec §1) but those modes are spec-Phase-3 features.** The homepage state system ships in Phase 1 with slots for these actions; the buttons appear in Phase 3 when the modes exist.
6. **No `User` table.** Single-user local app → a `prefs` key-value table holds `onboardingCompleted`, notification prefs, challenge progress.
7. **Milestones fire at write time.** Repository emits domain events after successful writes; awarded milestones persist in a `milestones` table so each fires once per day/lifetime as appropriate.
8. **Phase 4 (widgets, Live Activity, Dynamic Island) is out of scope for this codebase.** Requires a native app or Capacitor wrapper; documented as a direction, not planned tasks.

## Data Model Evolution (Dexie migrations)

| Version | Phase | Change |
|---|---|---|
| v2 | 1 | `sessions`: add `type` field (upgrade backfills `'standard'`; add `type` index). New table `categoryStats: id` (usageCount, lastUsedAt, favorite). |
| v3 | 2 | New tables: `days: date` (startedAt, endedAt, directionData), `dailyDirections: [date+categoryId]` (targetDurationMs?), `prefs: key`, `milestones: id` (kind, dayKey, firedAt). |
| v4 | 3 | New table `checkIns: id, endTime, startTime` (label, startTime, endTime|null). |

Rules: every migration gets a unit test with `fake-indexeddb` (open v1 data → upgrade → assert). Never rename/remove fields in place; additive only.

---

## Phase 1 — Core Loop (spec §1, 6, 7, 11, 12)

Goal: improve open-app → complete-session experience. Highest priority.

### 1.1 Data groundwork
- Dexie v2 (see table above); `Session.type` added to `domain/session.ts`.
- New `domain/todayStats.ts`: `hasSessionToday`, `sessionCount`, `totalTrackedMs` (from `listByDay(today)` + `activeMs`), + `hooks/useTodayStats.ts` (liveQuery).
- `sessionRepository.start()` bumps `categoryStats` (usageCount, lastUsedAt) in the same transaction.

### 1.2 Homepage state system (§1)
- `HomeScreen` becomes a state switch on `useTodayStats`:
  - **State A (no sessions today):** first-session prompt, primary CTA *Start First Session* (opens existing picker flow); secondary Check-In/Drift slots hidden until Phase 3.
  - **State B (sessions exist):** compact today summary (count, total tracked, per-category chips) + quick actions: *Start Session*, *View Today*.
- Extract current picker+note flow into `components/start/StartSessionFlow.tsx` so both states reuse it.

### 1.3 Session start transition (§6)
- `components/start/StartTransition.tsx`: full-screen category-colored animation between category select and timer; 2–4 s for first session of day, 1–2 s otherwise; tap to skip; honor `prefers-reduced-motion` (skip to ~300 ms fade).
- Implemented as a pre-navigation state in `StartSessionFlow` (no new route; `/active` remains the timer).

### 1.4 Category selection improvements (§7)
- `CategoryPicker`: order by recency (from `categoryStats`), favorite toggle (star, persisted), richer cards (existing icon/color + hint).
- **Quick start**: one-tap "start last category again, no note" button on Home State B.

### 1.5 Active session screen upgrade (§11)
- Keep screen minimal (spec constraint). Add: slow ambient background animation on existing `activeWash`, breathing accent ring around `TimerDisplay`, status line ("Focusing · 42 min" / paused state). CSS-only animations, reduced-motion aware.

### 1.6 Session summary redesign (§12)
- `SessionSummary` already shows category/start/end/duration + pause metrics; restructure into Summary / Metrics / **Next Actions** sections.
- Next actions: *Start New Session* (→ picker), *Return Home*; *Start Check-In* / *Start Drift* slots land in Phase 3.

**Exit criteria:** all Home/summary states covered by unit tests; e2e `core-flow` updated (snapshots re-baselined); coverage thresholds hold; migration test green.

## Phase 2 — Daily Habit & Retention (spec §4, 14, 5, 2, 16, 17, 13)

Goal: retention and daily usage.

### 2.1 Data: Dexie v3 (days, dailyDirections, prefs, milestones) + `dayRepository`, `prefsRepository`.

### 2.2 Start Day flow (§4)
- Home State A gains *Start Day*: creates `Day{date, startedAt}` → optional daily-direction screen → into first session flow. Skippable; starting a session without it implicitly starts the day.

### 2.3 Daily direction (§5)
- Direction picker: choose intended categories + optional target durations → `dailyDirections` rows. Displayed as a quiet strip on Home State B. (Intended-vs-actual comparison ships with the Phase 3 dashboard.)

### 2.4 End Day flow (§14)
- *End Day* action (Home State B / Daily screen) sets `Day.endedAt`, navigates to a day-summary view (reuses `DailyTotals` + timeline) for closure/reflection.

### 2.5 Reward layer (§13)
- `domain/milestones.ts`: evaluate after each session write — `first_session` (today), `one_hour` (today total), `five_sessions` (today). Persist to `milestones`; surface as lightweight toast on summary screen, plus started/completed confirmation states. No streaks/gamification beyond spec.

### 2.6 Notification system (§2) — within web limits (Decision 4)
- Settings surface (new `/settings` route or Home sheet): permission request flow, first-session reminder time, re-engagement toggle. Stored in `prefs`.
- In-app nudges always work (Home banners); `Notification` fired via SW when app is open/backgrounded-alive. Direction-based copy references selected categories.

### 2.7 Onboarding (§16) + Three-day challenge (§17)
- First-launch 4-step sequence (purpose → session tracking → challenge intro → start first session); `prefs.onboardingCompleted` guards it.
- Challenge progress (day 1 session, day 2 session, day 3 dashboard visit) tracked in `prefs`; small progress card on Home during first 3 days.

**Exit criteria:** onboarding shows exactly once; day lifecycle + milestones unit-tested; notifications degrade gracefully when permission denied.

## Phase 3 — Expanded Time Capture (spec §9, 10, 15)

Goal: capture more of the day beyond focused sessions.

### 3.1 Drift mode (§9)
- Start Drift = `sessionRepository.start` with `type:'drift'` (neutral accent, no category pick, no note). Summary offers *Convert to category* (sets categoryId post-hoc). "Still drifting?" periodic prompt = optional, defer unless cheap.

### 3.2 Check-In mode (§10)
- Dexie v4 `checkIns` + `checkInRepository` (start(label), end; single open check-in).
- Minimal UI: label input from Home quick actions; persistent slim chip in `AppShell` while open ("Lunch · 23m · End").

### 3.3 Daily summary dashboard (§15)
- `DailyTimeline` renders sessions + drift (styled distinctly) + check-ins; `DailyTotals` adds per-category durations, session/check-in counts, and **intended vs actual** row when `dailyDirections` exist (no enforcement, comparison only).
- Narrative auto-summaries = future enhancement, out of v2.

### 3.4 Wire the deferred CTAs
- Home State A/B and Session Summary gain *Check In* and *Drift* actions (slots from Phases 1.2/1.6).

**Exit criteria:** timeline correct with mixed types; e2e covers drift + check-in happy paths.

## Phase 4 — Mobile Native (spec §3) — direction only, not scheduled

Lock-screen/home-screen widgets, Live Activities, Dynamic Island require native code. Options when prioritized: (a) Capacitor wrap of this codebase + native widget extensions, (b) separate native app sharing the data model. Reliable scheduled notifications (Decision 4) also resolve here. No tasks in this plan.

---

## Cross-Cutting Requirements

- **i18n:** every new string added to both `zh` and `en` dicts in `src/i18n/messages.ts` (missing keys are compile errors). Notification copy must interpolate category labels via existing keys.
- **Testing:** keep 80% coverage thresholds; new domain modules (todayStats, milestones, migrations, checkIn logic) get unit tests; Playwright snapshots re-baselined once per phase (`test:e2e:update`), reviewed by eye.
- **PWA:** new routes/assets fall under existing `globPatterns`; verify SW autoUpdate after each phase deploy; consider Badging API for open check-in.
- **A11y:** all new animation honors `prefers-reduced-motion`; transitions skippable; toasts `aria-live="polite"`.
- **Convention:** one PR/report per phase in `.claude/PRPs/reports/`, matching existing workflow.

## Traceability (spec feature → plan)

| # | Spec feature | Where |
|---|---|---|
| 1 | Homepage state system | 1.2 |
| 2 | Notification system | 2.6 (web-limited; full in Phase 4) |
| 3 | Mobile quick access | Phase 4 (future) |
| 4 | Start Day flow | 2.2 |
| 5 | Daily direction | 2.3 (+3.3 comparison) |
| 6 | Session start transition | 1.3 |
| 7 | Category selection improvements | 1.4 |
| 8 | Standard session mode | Exists; unchanged |
| 9 | Drift mode | 3.1 |
| 10 | Check-In mode | 3.2 |
| 11 | Active session screen upgrade | 1.5 |
| 12 | Session summary redesign | 1.6 (+3.4) |
| 13 | Reward layer | 2.5 |
| 14 | End Day flow | 2.4 |
| 15 | Daily summary dashboard | 3.3 |
| 16 | Onboarding flow | 2.7 |
| 17 | Three-day challenge | 2.7 |

## Open Questions

1. **Custom categories** — does v2 need user-defined categories, or are recents/favorites over the fixed six enough? (Plan assumes fixed; changing this reopens Decision 1 and touches i18n/CSS.)
2. **Check-in ↔ session concurrency** — may a check-in stay open while a session runs? (Plan default: yes.)
3. **Day boundary** — `dayKey` is local midnight. If a user ends their day at 1 a.m., post-midnight sessions land on the next date. Accept, or introduce a configurable day-rollover hour with Start/End Day?
4. ~~**Drift "Still drifting?" prompt** — include in 3.1 or defer?~~ **Resolved:** shipped post-Phase-3 with a configurable interval (Settings → Session; default 15 min, off supported).
5. **Notification backend** — is a minimal push server (or Phase 4 native) acceptable later, or must v2 stay fully serverless? Affects how reminder settings are worded.

## Suggested First Steps

1. Phase 1.1 data groundwork (small, unblocks everything).
2. 1.2 homepage states + 1.4 category improvements (same surfaces).
3. 1.3 transition + 1.5 active screen (same visual language).
4. 1.6 summary redesign → re-baseline e2e → phase report.
