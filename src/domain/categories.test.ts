import { describe, it, expect } from 'vitest'
import { CATEGORIES, categoryAccent, getCategory, isCategoryId } from './categories'

describe('categories', () => {
  it('has six unique categories', () => {
    expect(CATEGORIES).toHaveLength(6)
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(6)
  })
  it('looks up by id', () => {
    expect(getCategory('work').icon).toBe('💼')
    expect(getCategory('other').colorVar).toBe('--cat-other')
  })
  it('falls back to other visuals for unknown ids, preserving the id', () => {
    const category = getCategory('ft-123')
    expect(category.id).toBe('ft-123')
    expect(category.colorVar).toBe('--cat-other')
  })
  it('categoryAccent prefers the builtin var, then custom color, then neutral', () => {
    expect(categoryAccent(CATEGORIES[0])).toBe('var(--cat-work)')
    expect(categoryAccent({ id: 'x', icon: '', color: 'oklch(58% 0.14 45)' })).toBe(
      'oklch(58% 0.14 45)',
    )
    expect(categoryAccent({ id: 'x', icon: '' })).toBe('var(--cat-other)')
  })
  it('guards values from outside the type system', () => {
    expect(isCategoryId('work')).toBe(true)
    expect(isCategoryId('nope')).toBe(false)
    expect(isCategoryId(123)).toBe(false)
    expect(isCategoryId(null)).toBe(false)
  })
})
