import type { CategoryId } from './session'

export interface Category {
  /** Builtin CategoryId or a custom focus-type id. */
  id: string
  icon: string // emoji glyph ('' when iconImage carries a custom picture)
  colorVar?: string // CSS custom-property name for a builtin accent
  color?: string // literal CSS color for a custom focus type
  label?: string // custom display label (builtins resolve via the i18n catalog)
  iconImage?: string // data-URL picture for a custom focus type
}

/** A builtin catalog entry: closed id union + a guaranteed accent var. */
export interface BuiltinCategory extends Category {
  id: CategoryId
  colorVar: string
}

// Display label & hint live in the i18n catalog under `category.<id>.label` / `.hint`.
export const CATEGORIES: readonly BuiltinCategory[] = [
  { id: 'work', icon: '💼', colorVar: '--cat-work' },
  { id: 'study', icon: '📚', colorVar: '--cat-study' },
  { id: 'rest', icon: '☕️', colorVar: '--cat-rest' },
  { id: 'exercise', icon: '🏃', colorVar: '--cat-exercise' },
  { id: 'chores', icon: '🧺', colorVar: '--cat-chores' },
  { id: 'other', icon: '✨', colorVar: '--cat-other' },
]

const BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<string, Category>

/**
 * Look up a builtin category. Unknown ids (custom focus types when the live list isn't at
 * hand) fall back to neutral 'other' visuals with the requested id preserved.
 */
export function getCategory(id: string): Category {
  return BY_ID[id] ?? { ...BY_ID.other, id }
}

/** The CSS color expression for a category's accent (builtin var or custom literal). */
export function categoryAccent(category: Category): string {
  if (category.colorVar) return `var(${category.colorVar})`
  return category.color ?? 'var(--cat-other)'
}

/** Runtime guard for values arriving from outside the type system (route params, storage, etc.). */
export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(BY_ID, value)
}
