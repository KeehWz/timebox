import type { CategoryId } from './session'
import { CATEGORIES } from './categories'

/**
 * One intended focus area for a day (spec §5). No enforcement — the dashboard only
 * compares intention vs reality (comparison ships with the Phase 3 dashboard).
 * Primary key: [date+categoryId].
 */
export interface DailyDirection {
  date: string // local 'YYYY-MM-DD'
  categoryId: CategoryId
  targetDurationMs: number | null // null = category chosen without a time target
}

/** What the direction form collects for one category. */
export interface DirectionEntry {
  categoryId: CategoryId
  targetDurationMs: number | null
}

const DEFAULT_ORDER = new Map(CATEGORIES.map((category, index) => [category.id, index]))

/** Stable display order for direction chips: the default catalog order. */
export function orderDirections(directions: readonly DailyDirection[]): DailyDirection[] {
  return [...directions].sort(
    (a, b) => (DEFAULT_ORDER.get(a.categoryId) ?? 0) - (DEFAULT_ORDER.get(b.categoryId) ?? 0),
  )
}
