import { db } from './db'
import type { DailyDirection, DirectionEntry } from '../domain/dailyDirection'

/** Intended focus areas per day (spec §5). Setting replaces the whole day's list. */
export const dailyDirectionRepository = {
  async setForDate(date: string, entries: readonly DirectionEntry[]): Promise<void> {
    await db.transaction('rw', db.dailyDirections, async () => {
      await db.dailyDirections.where('date').equals(date).delete()
      const rows: DailyDirection[] = entries.map((entry) => ({
        date,
        categoryId: entry.categoryId,
        targetDurationMs: entry.targetDurationMs,
      }))
      if (rows.length > 0) await db.dailyDirections.bulkAdd(rows)
    })
  },

  listByDate(date: string): Promise<DailyDirection[]> {
    return db.dailyDirections.where('date').equals(date).toArray()
  },
}
