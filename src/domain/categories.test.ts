import { describe, it, expect } from 'vitest'
import { CATEGORIES, getCategory, isCategoryId } from './categories'

describe('categories', () => {
  it('has six unique categories', () => {
    expect(CATEGORIES).toHaveLength(6)
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(6)
  })
  it('looks up by id', () => {
    expect(getCategory('work').icon).toBe('💼')
    expect(getCategory('other').colorVar).toBe('--cat-other')
  })
  it('guards values from outside the type system', () => {
    expect(isCategoryId('work')).toBe(true)
    expect(isCategoryId('nope')).toBe(false)
    expect(isCategoryId(123)).toBe(false)
    expect(isCategoryId(null)).toBe(false)
  })
})
