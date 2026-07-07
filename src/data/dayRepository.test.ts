import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { dayRepository } from './dayRepository'

beforeEach(async () => {
  await db.days.clear()
})

describe('dayRepository', () => {
  it('ensureStarted creates the day once and keeps the first start time', async () => {
    await dayRepository.ensureStarted('2026-07-06', 100)
    await dayRepository.ensureStarted('2026-07-06', 999)
    expect(await dayRepository.get('2026-07-06')).toEqual({
      date: '2026-07-06',
      startedAt: 100,
      endedAt: null,
    })
  })

  it('endDay closes a started day without touching startedAt', async () => {
    await dayRepository.ensureStarted('2026-07-06', 100)
    await dayRepository.endDay('2026-07-06', 500)
    expect(await dayRepository.get('2026-07-06')).toEqual({
      date: '2026-07-06',
      startedAt: 100,
      endedAt: 500,
    })
  })

  it('endDay on an untouched day creates a record with no start', async () => {
    await dayRepository.endDay('2026-07-07', 500)
    expect(await dayRepository.get('2026-07-07')).toEqual({
      date: '2026-07-07',
      startedAt: null,
      endedAt: 500,
    })
  })
})
