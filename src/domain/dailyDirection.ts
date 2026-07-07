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

/** One row of the dashboard's intended-vs-actual comparison (spec §5 — no enforcement). */
export interface DirectionComparison {
  categoryId: CategoryId
  targetDurationMs: number | null
  actualMs: number
}

/**
 * Compare intended categories against actually-recorded focus time. Only intended
 * categories appear (the regular per-category totals cover everything else).
 */
export function compareToDirections(
  directions: readonly DailyDirection[],
  actualByCategory: Partial<Record<CategoryId, number>>,
): DirectionComparison[] {
  return orderDirections(directions).map((direction) => ({
    categoryId: direction.categoryId,
    targetDurationMs: direction.targetDurationMs,
    actualMs: actualByCategory[direction.categoryId] ?? 0,
  }))
}
