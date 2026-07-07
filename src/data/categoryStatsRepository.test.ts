import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { categoryStatsRepository } from './categoryStatsRepository'
import { sessionRepository } from './sessionRepository'

beforeEach(async () => {
  await db.sessions.clear()
  await db.categoryStats.clear()
})

describe('categoryStatsRepository', () => {
  it('creates a row on first use and increments after', async () => {
    await categoryStatsRepository.recordUse('work', 100)
    await categoryStatsRepository.recordUse('work', 200)
    const all = await categoryStatsRepository.getAll()
    expect(all).toEqual([{ id: 'work', usageCount: 2, lastUsedAt: 200, favorite: false }])
  })

  it('toggles favorite without touching usage', async () => {
    await categoryStatsRepository.recordUse('study', 100)
    await categoryStatsRepository.toggleFavorite('study')
    expect((await db.categoryStats.get('study'))?.favorite).toBe(true)
    await categoryStatsRepository.toggleFavorite('study')
    const row = await db.categoryStats.get('study')
    expect(row?.favorite).toBe(false)
    expect(row?.usageCount).toBe(1)
  })

  it('can favorite a never-used category', async () => {
    await categoryStatsRepository.toggleFavorite('chores')
    expect(await db.categoryStats.get('chores')).toEqual({
      id: 'chores',
      usageCount: 0,
      lastUsedAt: 0,
      favorite: true,
    })
  })
})

describe('sessionRepository.start (v2)', () => {
  it('stamps type=standard and records category usage in the same transaction', async () => {
    const session = await sessionRepository.start('work', 'note')
    expect(session.type).toBe('standard')
    const row = await db.categoryStats.get('work')
    expect(row?.usageCount).toBe(1)
    expect(row?.lastUsedAt).toBe(session.startedAt)
  })

  it('does not record usage for drift sessions', async () => {
    const drift = await sessionRepository.start('other', '', 'drift')
    expect(drift.type).toBe('drift')
    expect(await db.categoryStats.get('other')).toBeUndefined()
  })
})
