/**
 * A lightweight time marker (spec §10): "Lunch", "Commute" — background tracking with
 * minimal UI, no pause machinery, no category. Spec model is {id, label, start, end};
 * `status` is added because IndexedDB cannot index null endedAt (open-check-in lookup),
 * and `dayKey` for the daily timeline query — both derived, both indexed.
 *
 * Invariant: at most one open check-in; starting a new one closes the previous.
 * Check-ins may overlap a running session (v2 plan Decision 3 — open question, default allowed).
 */
export interface CheckIn {
  id: string
  label: string
  startedAt: number // epoch ms
  endedAt: number | null // null while open
  status: 'open' | 'done'
  dayKey: string // local 'YYYY-MM-DD' from startedAt
  createdAt: number
  updatedAt: number
}

/** Elapsed wall-clock ms (open check-ins measured up to `now`). */
export function checkInElapsedMs(checkIn: CheckIn, now: number): number {
  return Math.max(0, (checkIn.endedAt ?? now) - checkIn.startedAt)
}
