import { describe, it, expect } from 'vitest'
import { orderDirections } from './dailyDirection'
import type { DailyDirection } from './dailyDirection'

function direction(categoryId: DailyDirection['categoryId']): DailyDirection {
  return { date: '2026-07-06', categoryId, targetDurationMs: null }
}

describe('orderDirections', () => {
  it('sorts chips into the default catalog order', () => {
    const ordered = orderDirections([direction('other'), direction('work'), direction('rest')])
    expect(ordered.map((d) => d.categoryId)).toEqual(['work', 'rest', 'other'])
  })

  it('handles an empty list', () => {
    expect(orderDirections([])).toEqual([])
  })
})
