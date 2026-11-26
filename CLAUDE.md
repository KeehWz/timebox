# TimeBox

A personal time-awareness app: mark stretches of the day, see where time went. Local-first PWA,
served from Cloudflare Workers with a small API for usage events and feedback, plus an iOS app
that wraps the same build with Capacitor.

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
- `npx wrangler dev` — the built app plus the API against a local D1 (run `npm run build` first)
- `npm run deploy` — build and deploy to Cloudflare by hand. Rarely needed: see Deployment.
- `npm run metrics` — retention, usage and latest feedback from the production database
- `npm run ios` — build, copy into the iOS project and open Xcode (macOS). `npm run ios:sync` without opening.

All of these must pass before a PR.

## Deployment

- Production: https://timebox.michaelwz2180.workers.dev (Cloudflare Worker `timebox`, D1 database `timebox`).
- **Merging to `main` deploys.** Cloudflare builds and deploys every push to `main` within a couple of
  minutes. Treat a merge as a release: only merge when Zhen has said to ship it.
- `npx wrangler deployments list --name timebox` shows what is live and when it went out.
- After a deploy, check `GET /` is 200 and `GET /api/events` is 405 (the Worker is routing the API).

## iOS

- `ios/` is the Capacitor 8 project (Swift Package Manager, no CocoaPods). Bundle id
  `io.github.keehwz.timebox`, iPhone only, portrait only. Commit `ios/`; `ios/App/App/public` is generated.
- It runs the same `dist/` as the web. Branch on `isNative` from `src/lib/platform.ts` for the few
  differences: the API is called at its full production address (`apiUrl()`), and local notifications.
- Local notifications: `src/domain/notifications.ts` plans them from the state (pure, unit-tested);
  `src/native/notifications.ts` replaces the pending ones whenever the plan changes. Permission is asked
  the first time there is something to schedule.
- The Worker allows `capacitor://localhost` through CORS. Add an origin there if another shell is added.
- Icon and launch screen come from `npm run generate-icons`.
- Building for a device or TestFlight needs Zhen's Apple developer account; signing is set in Xcode.

## Layout

- `src/domain/` — pure logic and types (durations, day boundary, stats). Unit-tested; no React, no Dexie.
- `src/data/` — Dexie schema + migration (`db.ts`), every write as a function (`store.ts`), live read (`useAppState.ts`).
- `src/screens/`, `src/ui/` — presentational, props in / callbacks out. Covered by the e2e flow.
- `src/App.tsx` — which screen is showing, and wiring callbacks to `store` and `record()`.
- `worker/index.ts` — the Cloudflare Worker: `POST /api/events`, `POST /api/feedback` → D1; everything
  else is static assets. Payload shapes and validation are shared from `src/domain/telemetry.ts`.
- `scripts/metrics.sql` — the questions we ask of the data. Tested against the schema.

## Rules that are not in the prototype

- Elapsed time is always derived from timestamps (`now − start − paused`), never accumulated.
- The running session and an unfinished end-of-day reflection are stored, so they survive reloads
  and take precedence over the in-memory `view`.
- Starting a session before Start Today starts the day at that moment.
- A day that was never ended is closed quietly on the next open after 4am, ending at its last recording.
- Today's Direction is cleared when the day closes. Closed days are archived in the `days` table.
- A session belongs to the day it was recorded in: everything between Start Today and End Today counts
  toward Start Today's date, even past midnight (`sessionDayKey` in `src/domain/time.ts`). Stats groups by
  this, never by calendar date, and its "today" is the open day's date.
- `sessions` holds finished recordings only; `typeName` is copied in so history survives renames/deletes.
- Ending a session takes a 900ms hold. A click with no pointer behind it (keyboard, switch control)
  cannot hold, so it opens a confirm dialog instead.
- If the local database cannot be opened, `StorageUnavailable` is shown. The live query never
  resolves in that case and does not throw, so an error boundary would not catch it.
- Every screen away from Record, and the Settings sheet, holds one browser history entry, so the system
  back button returns to Record or closes Settings. Navigate with `navigate()` in `App.tsx`, not `setView`.
- No `Date.now()` / `new Date()` during render — use `useNow()` (the React Compiler lint rule enforces this).

## Usage events and feedback

- Events carry counts, flags and durations only. Never send anything the user typed (descriptions,
  category names, reflections); the validator rejects string props so this cannot happen by accident.
- Add a new event by adding its name to `EVENT_NAMES` and calling `record()` from `App.tsx`.
- Sharing is on by default, and said so: a privacy note on first launch asks "Sounds good" /
  "Don't share". Events queue from launch but nothing is sent until the note is answered.
- Events wait in a local outbox and are sent when online. "Share anonymous usage" in Settings turns
  them off and discards the outbox. Feedback is always sent — the user chose to write it.
- Identity is a random install id. No account, no IP address stored.
- The API is rate-limited per IP (`ratelimits` in `wrangler.jsonc`). The IP is only the limiter's
  short-lived key. The client keeps a batch that gets 429 and retries it later.
- `day_start` / `day_end` carry `auto: true` when a session started the day or a stale day closed itself.
- The Worker creates its tables on first use; there is no migration step.

## Not wired yet

- On the web, "Nudge me" and "Remind me if time stays unmarked" are stored but send nothing: browsers
  have no scheduled local notifications. They work in the iOS app.
- The unmarked-time reminder never lands between 22:00 and 07:00 (quiet hours, not in the prototype).
- Focus only marks the session and records its focused duration.
