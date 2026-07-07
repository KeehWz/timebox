import { db } from './db'
import type { CheckIn } from '../domain/checkIn'
import { toDayKey } from '../domain/time'
import { newId } from '../lib/id'

/**
 * Lightweight time markers (spec §10). Invariant: at most one open check-in — starting a
 * new one closes the previous at the same instant, so markers never overlap each other.
 * Check-ins are independent of sessions (they may run alongside one).
 */
export const checkInRepository = {
  /** The single open check-in, or null. */
  async getOpen(): Promise<CheckIn | null> {
    const open = await db.checkIns.where('status').equals('open').first()
    return open ?? null
  },

  /** Start a check-in with the given label, closing any open one first. */
  async start(label: string): Promise<CheckIn> {
    return db.transaction('rw', db.checkIns, async () => {
      const now = Date.now()
      const open = await db.checkIns.where('status').equals('open').first()
      if (open) {
        await db.checkIns.put({ ...open, endedAt: now, status: 'done', updatedAt: now })
      }
      const checkIn: CheckIn = {
        id: newId(),
        label: label.trim(),
        startedAt: now,
        endedAt: null,
        status: 'open',
        dayKey: toDayKey(now),
        createdAt: now,
        updatedAt: now,
      }
      await db.checkIns.add(checkIn)
      return checkIn
    })
  },

  /** End the open check-in. No-op if none. */
  async endOpen(): Promise<void> {
    await db.transaction('rw', db.checkIns, async () => {
      const open = await db.checkIns.where('status').equals('open').first()
      if (!open) return
      const now = Date.now()
      await db.checkIns.put({ ...open, endedAt: now, status: 'done', updatedAt: now })
    })
  },

  /** Check-ins for a local day, ordered by start time. */
  listByDay(dayKey: string): Promise<CheckIn[]> {
    return db.checkIns.where('dayKey').equals(dayKey).sortBy('startedAt')
  },
}
