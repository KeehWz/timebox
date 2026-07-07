import { describe, it, expect } from 'vitest'
import { lastUsedCategoryId, orderCategories, type CategoryStats } from './categoryStats'
import type { CategoryId } from './session'

function stats(id: CategoryId, overrides: Partial<CategoryStats> = {}): CategoryStats {
  return { id, usageCount: 1, lastUsedAt: 0, favorite: false, ...overrides }
}

describe('orderCategories', () => {
  it('falls back to the default catalog order without stats', () => {
    expect(orderCategories([]).map((c) => c.id)).toEqual([
      'work',
      'study',
      'rest',
      'exercise',
      'chores',
      'other',
    ])
  })

  it('puts the most recently used categories first', () => {
    const order = orderCategories([
      stats('study', { lastUsedAt: 200 }),
      stats('rest', { lastUsedAt: 100 }),
    ]).map((c) => c.id)
    expect(order.slice(0, 2)).toEqual(['study', 'rest'])
    expect(order[2]).toBe('work') // remaining categories keep the default order
  })

  it('puts favorites ahead of more recently used non-favorites', () => {
    const order = orderCategories([
      stats('study', { lastUsedAt: 500 }),
      stats('chores', { favorite: true, lastUsedAt: 0 }),
    ]).map((c) => c.id)
    expect(order[0]).toBe('chores')
    expect(order[1]).toBe('study')
  })
})

describe('lastUsedCategoryId', () => {
  it('returns null when nothing has been used', () => {
    expect(lastUsedCategoryId([])).toBeNull()
    expect(lastUsedCategoryId([stats('work', { usageCount: 0, lastUsedAt: 0 })])).toBeNull()
  })

  it('returns the most recently used id', () => {
    expect(
      lastUsedCategoryId([stats('work', { lastUsedAt: 100 }), stats('rest', { lastUsedAt: 300 })]),
    ).toBe('rest')
  })
})
