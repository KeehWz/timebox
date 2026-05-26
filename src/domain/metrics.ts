import type { Session } from './session'

/** Wall-clock span from start to end (or `now` while still running). */
export function totalSpanMs(session: Session, now: number): number {
  return (session.endedAt ?? now) - session.startedAt
}

/** Sum of all pause intervals; an open pause is counted up to `now`. */
export function totalPausedMs(session: Session, now: number): number {
  return session.pauses.reduce((sum, p) => sum + ((p.resumedAt ?? now) - p.pausedAt), 0)
}

/**
 * Focus time = span − paused, clamped at 0 (defensive against clock skew).
 * Freezes automatically while paused: the open pause grows at the same rate as the span.
 */
export function activeMs(session: Session, now: number): number {
  return Math.max(0, totalSpanMs(session, now) - totalPausedMs(session, now))
}

export function pauseCount(session: Session): number {
  return session.pauses.length
}

/** Duration of the longest single pause (an open pause measured up to `now`). 0 if none. */
export function longestPauseMs(session: Session, now: number): number {
  return session.pauses.reduce((max, p) => Math.max(max, (p.resumedAt ?? now) - p.pausedAt), 0)
}
