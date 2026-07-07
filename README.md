# Timebox · 时间记录

A local-first, offline-capable PWA for recording where your time *actually* goes — no planning, no accounts, no backend. Tap a category, the timer starts; quick-pause micro-interruptions; long-press to end; your day rolls up into a timeline automatically. Bilingual (中文 / English).

## Features

**Core loop** — category picker with recents & favorites, one-tap quick start, a short category-colored transition before the timer (it never eats into focus time), a calm full-screen timer with quick-pause and long-press-to-end, and a session summary that flows into the next action.

**Daily rhythm** — optional Start Day flow with a daily direction (intended categories + time targets, comparison only, never enforced), End Day for closure, daily milestones (first session / 1 hour / 5 sessions), a three-day starter challenge, first-launch onboarding, and a web-limited first-session reminder.

**Time capture modes** — standard sessions, **drift** (unstructured time with post-hoc "file this under…" conversion and an optional "Still drifting?" nudge), and **check-ins** (lightweight background markers like "Lunch" with a persistent chip in the shell).

**Daily dashboard** — sessions, drift and check-ins interleaved on one timeline, per-category totals, intended-vs-actual, day counts, and an auto-generated one-line narrative of the day.

## Stack

React 19 · TypeScript · Vite · Dexie (IndexedDB) · react-router 7 · CSS Modules + design tokens · vite-plugin-pwa · Vitest (+ fake-indexeddb) · Playwright.

All data lives on-device. String UUID keys and an additive schema history (v1→v4, see `src/data/db.ts`) keep the store ready for optional cloud sync later.

## Development

```bash
npm install
npm run dev          # vite dev server
npm run typecheck    # tsc -b
npm run lint         # eslint
npm test             # vitest (80% coverage thresholds enforced via test:coverage)
npm run test:e2e     # playwright (screenshot baselines are macOS-recorded)
npm run build        # production build + PWA precache
```

CI (GitHub Actions) runs typecheck, lint, unit tests with coverage, the build, and the functional e2e suite on every push and PR. Re-baseline screenshots locally with `npm run test:e2e:update`.

## Architecture

```
src/
  domain/      pure logic & models (Session, CheckIn, Day, milestones, stats…) — fully unit-tested
  data/        Dexie schema + repositories; all writes are transactional and immutable
  hooks/       thin liveQuery wrappers (dexie-react-hooks)
  components/  presentational, grouped by feature; CSS Modules per group
  routes/      screens; orchestration only (excluded from coverage)
  i18n/        zh/en catalog — missing keys are compile errors, not runtime fallbacks
```

Timers are always *derived* (`now − startedAt − paused`), never accumulated, so they survive reloads, tab throttling and backgrounding.

## Roadmap

The v2 feature plan and per-phase reports live in `.claude/PRPs/plans/timebox-v2.plan.md` and `.claude/PRPs/reports/`. Remaining direction: a native wrapper for lock-screen widgets, Live Activities and reliable scheduled notifications.

## Deploy

Static deploy to Cloudflare via `wrangler` (see `wrangler.jsonc`); the app is a self-contained PWA — any static host works.
