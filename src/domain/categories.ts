import type { CategoryId } from './session'

export interface Category {
  id: CategoryId
  icon: string // emoji glyph (lightweight — no icon-font dependency)
  colorVar: string // CSS custom-property name for this category's accent
}

// Display label & hint live in the i18n catalog under `category.<id>.label` / `.hint`.
export const CATEGORIES: readonly Category[] = [
  { id: 'work', icon: '💼', colorVar: '--cat-work' },
  { id: 'study', icon: '📚', colorVar: '--cat-study' },
  { id: 'rest', icon: '☕️', colorVar: '--cat-rest' },
  { id: 'exercise', icon: '🏃', colorVar: '--cat-exercise' },
  { id: 'chores', icon: '🧺', colorVar: '--cat-chores' },
  { id: 'other', icon: '✨', colorVar: '--cat-other' },
]

const BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, Category>

/** Look up a category by id. Ids are a closed union, so this always resolves. */
export function getCategory(id: CategoryId): Category {
  return BY_ID[id]
}

/** Runtime guard for values arriving from outside the type system (route params, storage, etc.). */
export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BY_ID, value)
}
