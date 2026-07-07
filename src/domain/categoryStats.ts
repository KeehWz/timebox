import type { CategoryId } from './session'
import { CATEGORIES, type Category } from './categories'

/**
 * Per-category usage bookkeeping (schema v2). Powers the picker's recents ordering, favorites
 * and the home screen's quick-start action. One row per category, created lazily on first use.
 */
export interface CategoryStats {
  id: CategoryId
  usageCount: number
  lastUsedAt: number // epoch ms; 0 = never used
  favorite: boolean
}

const DEFAULT_ORDER = new Map(CATEGORIES.map((category, index) => [category.id, index]))

/**
 * Picker order: favorites first (most recently used favorite leads), then by recency,
 * then the default catalog order. Pure and deterministic; stats rows may be missing
 * for never-used categories.
 */
export function orderCategories(stats: readonly CategoryStats[]): Category[] {
  const byId = new Map(stats.map((s) => [s.id, s]))
  return [...CATEGORIES].sort((a, b) => {
    const sa = byId.get(a.id)
    const sb = byId.get(b.id)
    const favorite = Number(sb?.favorite ?? false) - Number(sa?.favorite ?? false)
    if (favorite !== 0) return favorite
    const recency = (sb?.lastUsedAt ?? 0) - (sa?.lastUsedAt ?? 0)
    if (recency !== 0) return recency
    return (DEFAULT_ORDER.get(a.id) ?? 0) - (DEFAULT_ORDER.get(b.id) ?? 0)
  })
}

/** Most recently used category id, or null if nothing has been tracked yet. */
export function lastUsedCategoryId(stats: readonly CategoryStats[]): CategoryId | null {
  let best: CategoryStats | null = null
  for (const s of stats) {
    if (s.lastUsedAt > 0 && (best === null || s.lastUsedAt > best.lastUsedAt)) best = s
  }
  return best?.id ?? null
}
