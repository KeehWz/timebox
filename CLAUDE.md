# TimeBox

A personal time-awareness app: mark stretches of the day, see where time went. Local-first PWA.

## Source of truth

The Figma Make prototype (`figma.com/make/HxtshXMM1NENTWWsqNdZUa`) decides UI, copy and behaviour.
`src/screens/*` and `src/styles/app.css` are ported from it — when the design changes, port the
change rather than restyling by hand. Where the prototype is silent (persistence, day boundaries),
the rules below apply.

## Product constraints

No streaks, scores, achievements, completion percentages, "time remaining", checkmarks for goals,
red failure states, or celebratory copy. Unrecorded time is never shown as bad.

## Commands

- `npm run dev` · `npm run build` · `npm run typecheck` · `npm run lint`
- `npm test` (vitest) · `npm run test:coverage`
- `npm run test:e2e` (Playwright; set `PW_CHANNEL=chrome` to use an installed Chrome)

All of these must pass before a PR.

## Layout

- `src/domain/` — pure logic and types (durations, day boundary, stats). Unit-tested; no React, no Dexie.
- `src/data/` — Dexie schema + migration (`db.ts`), every write as a function (`store.ts`), live read (`useAppState.ts`).
- `src/screens/`, `src/ui/` — presentational, props in / callbacks out. Covered by the e2e flow.
- `src/App.tsx` — which screen is showing, and wiring callbacks to `store`.

## Rules that are not in the prototype

- Elapsed time is always derived from timestamps (`now − start − paused`), never accumulated.
- The running session and an unfinished end-of-day reflection are stored, so they survive reloads
  and take precedence over the in-memory `view`.
- Starting a session before Start Today starts the day at that moment.
- A day that was never ended is closed quietly on the next open after 4am, ending at its last recording.
- Today's Direction is cleared when the day closes. Closed days are archived in the `days` table.
- `sessions` holds finished recordings only; `typeName` is copied in so history survives renames/deletes.
- No `Date.now()` / `new Date()` during render — use `useNow()` (the React Compiler lint rule enforces this).

## Not wired yet

- "Nudge me" and "Remind me if time stays unmarked" are stored but send nothing: the web has no
  scheduled local notifications. They become real in the iOS (Capacitor) shell.
- Focus only marks the session and records its focused duration.
