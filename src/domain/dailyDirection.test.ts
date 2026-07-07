import { describe, it, expect } from 'vitest'
import { compareToDirections, orderDirections } from './dailyDirection'
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

describe('compareToDirections', () => {
  it('pairs each intended category with its recorded focus time', () => {
    const directions: DailyDirection[] = [
      { date: '2026-07-06', categoryId: 'work', targetDurationMs: 7_200_000 },
      { date: '2026-07-06', categoryId: 'exercise', targetDurationMs: null },
    ]
    expect(compareToDirections(directions, { work: 3_600_000 })).toEqual([
      { categoryId: 'work', targetDurationMs: 7_200_000, actualMs: 3_600_000 },
      { categoryId: 'exercise', targetDurationMs: null, actualMs: 0 },
    ])
  })

  it('is empty without directions', () => {
    expect(compareToDirections([], { work: 100 })).toEqual([])
  })
})
