import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { checkInRepository } from './checkInRepository'

beforeEach(async () => {
  await db.checkIns.clear()
})

describe('checkInRepository', () => {
  it('starts an open check-in with a trimmed label', async () => {
    const checkIn = await checkInRepository.start('  Lunch  ')
    expect(checkIn.label).toBe('Lunch')
    expect(checkIn.status).toBe('open')
    expect(checkIn.endedAt).toBeNull()
    expect((await checkInRepository.getOpen())?.id).toBe(checkIn.id)
  })

  it('starting a new check-in closes the previous one', async () => {
    const first = await checkInRepository.start('Lunch')
    const second = await checkInRepository.start('Meeting')

    const closed = await db.checkIns.get(first.id)
    expect(closed?.status).toBe('done')
    expect(closed?.endedAt).not.toBeNull()
    expect((await checkInRepository.getOpen())?.id).toBe(second.id)
  })

  it('endOpen closes the open check-in and is a no-op after', async () => {
    const checkIn = await checkInRepository.start('Commute')
    await checkInRepository.endOpen()
    expect(await checkInRepository.getOpen()).toBeNull()
    expect((await db.checkIns.get(checkIn.id))?.status).toBe('done')

    await checkInRepository.endOpen() // no open check-in — must not throw
  })

  it('lists a day’s check-ins ordered by start', async () => {
    const a = await checkInRepository.start('Lunch')
    // distinct startedAt — Date.now() can return the same ms for back-to-back starts
    await new Promise((resolve) => setTimeout(resolve, 5))
    await checkInRepository.start('Meeting')
    const list = await checkInRepository.listByDay(a.dayKey)
    expect(list.map((c) => c.label)).toEqual(['Lunch', 'Meeting'])
  })
})
