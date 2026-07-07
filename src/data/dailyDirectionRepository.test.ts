import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { dailyDirectionRepository } from './dailyDirectionRepository'

beforeEach(async () => {
  await db.dailyDirections.clear()
})

describe('dailyDirectionRepository', () => {
  it('stores and lists a day\'s directions', async () => {
    await dailyDirectionRepository.setForDate('2026-07-06', [
      { categoryId: 'work', targetDurationMs: 3_600_000 },
      { categoryId: 'exercise', targetDurationMs: null },
    ])
    const rows = await dailyDirectionRepository.listByDate('2026-07-06')
    expect(rows).toHaveLength(2)
    expect(rows).toContainEqual({
      date: '2026-07-06',
      categoryId: 'work',
      targetDurationMs: 3_600_000,
    })
  })

  it('setForDate replaces the previous list, and an empty list clears it', async () => {
    await dailyDirectionRepository.setForDate('2026-07-06', [
      { categoryId: 'work', targetDurationMs: null },
    ])
    await dailyDirectionRepository.setForDate('2026-07-06', [
      { categoryId: 'study', targetDurationMs: null },
    ])
    const rows = await dailyDirectionRepository.listByDate('2026-07-06')
    expect(rows.map((r) => r.categoryId)).toEqual(['study'])

    await dailyDirectionRepository.setForDate('2026-07-06', [])
    expect(await dailyDirectionRepository.listByDate('2026-07-06')).toEqual([])
  })

  it('keeps days independent', async () => {
    await dailyDirectionRepository.setForDate('2026-07-06', [
      { categoryId: 'work', targetDurationMs: null },
    ])
    await dailyDirectionRepository.setForDate('2026-07-07', [
      { categoryId: 'rest', targetDurationMs: null },
    ])
    expect(await dailyDirectionRepository.listByDate('2026-07-06')).toHaveLength(1)
    expect(await dailyDirectionRepository.listByDate('2026-07-07')).toHaveLength(1)
  })
})
