# Report: TimeBox v2 — Phase 2 (Daily Habit & Retention)

**Plan:** `.claude/PRPs/plans/timebox-v2.plan.md` · **Spec items:** §2, §4, §5, §13, §14, §16, §17 · **Date:** 2026-07-06

## What shipped

**2.1 Data (Dexie v3).** New tables: `days` (date PK, startedAt/endedAt), `dailyDirections` (compound PK [date+categoryId], optional target), `prefs` (typed key/value via `PrefsShape`), `milestones` (natural key `dayKey:kind`). New repos: `dayRepository`, `dailyDirectionRepository`, `prefsRepository`, plus `rewardService`. `sessionRepository.start()` now implicitly starts the day; `end()` runs the reward layer in the same transaction.

**2.2 Start Day (§4).** `/start-day` route: marks the day started → optional direction form → lands directly in the first-session picker. Reached from Home State A's secondary CTA.

**2.3 Daily direction (§5).** `DirectionForm` — toggle categories + preset time targets (30 m–4 h), fully skippable. `DirectionStrip` shows the day's intent on Home (both states). No enforcement; intended-vs-actual comparison ships with the Phase 3 dashboard.

**2.4 End Day (§14).** Ghost CTA on Home State B sets `Day.endedAt` and lands on the daily summary for closure. Ended days show a note but never block further tracking (day-boundary semantics remain an open question in the plan).

**2.5 Reward layer (§13).** `first_session` / `one_hour` / `five_sessions` evaluated on every session end (pure `achievedMilestones` + persisted diff, fires once per day). `firedAt` = the session's `endedAt`, so the summary screen shows exactly the milestones earned by *this* session (`MilestoneToast`, aria-live). The start transition doubles as the "session started" confirmation state.

**2.6 Notifications (§2) — web-limited (plan Decision 4).** `/settings` (new nav item): permission flow with status copy, first-session reminder time (off/08/09/10/12). `useFirstSessionReminder` fires a local Notification once per day while the app is alive, past the configured time, with nothing tracked. Re-engagement reminders ("app not opened for X hours") are **not** implementable in a closed serverless PWA — deferred to Phase 4 native, and the settings copy says so honestly.

**2.7 Onboarding (§16) + three-day challenge (§17).** `/welcome`: 4 steps (purpose → sessions → challenge → start now), skippable, ends in the picker. `useOnboardingGate` routes brand-new users there; upgrading users (existing sessions, pref unset) are marked complete silently. Completing/skipping arms the challenge (`prefs.challenge`): days 1–2 complete on session end (rewardService), day 3 on visiting today's dashboard. `ChallengeCard` on Home shows progress during the 3-day window only.

## Verification

- `tsc -b` clean · `eslint .` clean · **153/153 tests pass** (39 files) · coverage 98.6% stmts / 88.8% branches (thresholds 80%) · `vite build` + PWA precache OK.
- New tests: milestone evaluation, challenge window/index math, day + direction repos, reward integration (fires once; challenge marking; implicit day start), onboarding gate (new/onboarded/upgrading), reminder hook (no-op guards + firing path with stubbed Notification), DirectionForm/Strip, ChallengeCard, MilestoneToast, live data hooks.
- e2e: onboarding-skip added to setup (fresh DB now gates to /welcome); new tests for the 4-step onboarding and the full day lifecycle (start day → direction → session → strip → end day); core flow asserts the first-session milestone.
- **Action required:** run `npm run test:e2e:update` locally to re-baseline screenshots (home changed again: challenge card + Start Day CTA).

## Notes / deviations from plan

- Challenge progress stored explicitly in `prefs.challenge` and marked at write points (not derived by cross-day queries) — simpler rendering, one source of truth.
- Re-engagement reminder cut from 2.6 (impossible on web without push); first-session reminder shipped.
- No separate ChallengeProgress table — a pref suffices for a single local user.

## Next

Phase 3 — expanded time capture: Dexie v4 `checkIns`, drift mode (type='drift' start path + neutral styling + convert-to-category), check-in chip in the shell, dashboard improvements (mixed-type timeline, per-category totals vs direction targets), and wiring the deferred Check-In/Drift CTAs on Home + Summary.
