import { db } from './db'
import type { CategoryStats } from '../domain/categoryStats'

/**
 * Usage bookkeeping behind the category picker (recents / favorites / quick start).
 * Rows are created lazily; a missing row simply means "never used, not favorited".
 */
export const categoryStatsRepository = {
  getAll(): Promise<CategoryStats[]> {
    return db.categoryStats.toArray()
  },

  /** Bump usage for a category. Called on session start, inside the same transaction. */
  async recordUse(id: string, at: number): Promise<void> {
    const existing = await db.categoryStats.get(id)
    const updated: CategoryStats = existing
      ? { ...existing, usageCount: existing.usageCount + 1, lastUsedAt: at }
      : { id, usageCount: 1, lastUsedAt: at, favorite: false }
    await db.categoryStats.put(updated)
  },

  async toggleFavorite(id: string): Promise<void> {
    const existing = await db.categoryStats.get(id)
    const updated: CategoryStats = existing
      ? { ...existing, favorite: !existing.favorite }
      : { id, usageCount: 0, lastUsedAt: 0, favorite: true }
    await db.categoryStats.put(updated)
  },
}
