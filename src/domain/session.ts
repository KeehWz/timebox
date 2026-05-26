/** A single time-type the user can track. */
export type CategoryId = 'work' | 'study' | 'rest' | 'exercise' | 'chores' | 'other'

/** Lifecycle state of a session. */
export type SessionStatus = 'active' | 'paused' | 'completed'

/**
 * One quick-pause interval inside a session.
 * `resumedAt` is null while the pause is still open (i.e. the session is currently paused).
 */
export interface PauseInterval {
  pausedAt: number // epoch ms
  resumedAt: number | null // epoch ms, null while paused
}

/**
 * A tracked session. All timestamps are epoch milliseconds (sync/serialization friendly).
 *
 * Derived metrics (span / focus / paused totals) are computed on demand from these timestamps,
 * never stored — see domain/metrics.ts. That keeps the timer correct across reloads, tab
 * throttling, and backgrounding, because elapsed is always `now - startedAt - paused`.
 */
export interface Session {
  id: string
  categoryId: CategoryId
  note: string // optional detail; '' when none — never null/undefined
  startedAt: number
  endedAt: number | null // null until completed
  pauses: PauseInterval[]
  status: SessionStatus
  dayKey: string // local 'YYYY-MM-DD' derived from startedAt; index for the daily page
  createdAt: number
  updatedAt: number
}
