import { db } from './db'
import type { Day } from '../domain/day'

/** Day lifecycle records (spec §4 / §14). Rows are created lazily. */
export const dayRepository = {
  async get(date: string): Promise<Day | null> {
    return (await db.days.get(date)) ?? null
  },

  /** Mark the day started if it isn't yet. Safe to call repeatedly (idempotent). */
  async ensureStarted(date: string, at: number): Promise<void> {
    const existing = await db.days.get(date)
    if (!existing) {
      await db.days.add({ date, startedAt: at, endedAt: null })
    } else if (existing.startedAt === null) {
      await db.days.put({ ...existing, startedAt: at })
    }
  },

  /** Explicitly close the day (idempotent — a second call moves the end time). */
  async endDay(date: string, at: number): Promise<void> {
    const existing = await db.days.get(date)
    if (!existing) {
      await db.days.add({ date, startedAt: null, endedAt: at })
    } else {
      await db.days.put({ ...existing, endedAt: at })
    }
  },
}
