import type { Session } from './session'
import { activeMs } from './metrics'

/** Home-screen aggregates for the current day (spec §1 — homepage state system). */
export interface TodayStats {
  /** State A (false) vs State B (true) on the home screen. */
  hasSession: boolean
  sessionCount: number
  /** Focus ms across today's sessions; a still-running session counts up to `now`. */
  totalTrackedMs: number
  /** Category of the most recently started session today, or null. Drives quick start. */
  lastCategoryId: string | null
}

/** Pure rollup over one day's sessions (any status). */
export function computeTodayStats(sessions: readonly Session[], now: number): TodayStats {
  let totalTrackedMs = 0
  let latest: Session | null = null
  for (const session of sessions) {
    totalTrackedMs += activeMs(session, now)
    if (latest === null || session.startedAt > latest.startedAt) latest = session
  }
  return {
    hasSession: sessions.length > 0,
    sessionCount: sessions.length,
    totalTrackedMs,
    lastCategoryId: latest?.categoryId ?? null,
  }
}
