import { CATEGORIES, type Category } from './categories'

/**
 * Per-category usage bookkeeping (schema v2). Powers the picker's recents ordering, favorites
 * and the home screen's quick-start action. One row per category, created lazily on first use.
 * Ids cover builtins and custom focus types alike.
 */
export interface CategoryStats {
  id: string
  usageCount: number
  lastUsedAt: number // epoch ms; 0 = never used
  favorite: boolean
}

/**
 * Picker order: favorites first (most recently used favorite leads), then by recency,
 * then the default catalog order (builtins first, then custom types by creation).
 * Pure and deterministic; stats rows may be missing for never-used categories.
 */
export function orderCategories(
  stats: readonly CategoryStats[],
  customs: readonly Category[] = [],
): Category[] {
  const catalog = [...CATEGORIES, ...customs]
  const DEFAULT_ORDER = new Map(catalog.map((category, index) => [category.id, index]))
  const byId = new Map(stats.map((s) => [s.id, s]))
  return catalog.sort((a, b) => {
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
export function lastUsedCategoryId(stats: readonly CategoryStats[]): string | null {
  let best: CategoryStats | null = null
  for (const s of stats) {
    if (s.lastUsedAt > 0 && (best === null || s.lastUsedAt > best.lastUsedAt)) best = s
  }
  return best?.id ?? null
}
