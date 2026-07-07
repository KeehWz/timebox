import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'
import { sessionRepository } from './sessionRepository'
import { prefsRepository } from './prefsRepository'
import { rewardService } from './rewardService'
import { addDays, toDayKey } from '../domain/time'

beforeEach(async () => {
  await Promise.all([
    db.sessions.clear(),
    db.categoryStats.clear(),
    db.days.clear(),
    db.prefs.clear(),
    db.milestones.clear(),
  ])
})

describe('reward layer on session end', () => {
  it('fires first_session exactly once per day', async () => {
    const first = await sessionRepository.start('work', '')
    const ended = await sessionRepository.end(first.id)

    let milestones = await db.milestones.where('dayKey').equals(ended.dayKey).toArray()
    expect(milestones.map((m) => m.kind)).toEqual(['first_session'])
    expect(milestones[0].firedAt).toBe(ended.endedAt)

    const second = await sessionRepository.start('study', '')
    await sessionRepository.end(second.id)
    milestones = await db.milestones.where('dayKey').equals(ended.dayKey).toArray()
    expect(milestones.filter((m) => m.kind === 'first_session')).toHaveLength(1)
  })

  it('marks challenge day 1 when a session completes', async () => {
    const today = toDayKey(Date.now())
    await prefsRepository.set('challenge', { startDate: today, completed: [false, false, false] })

    const session = await sessionRepository.start('work', '')
    await sessionRepository.end(session.id)

    expect((await prefsRepository.get('challenge'))?.completed).toEqual([true, false, false])
  })

  it('starting a session implicitly starts the day', async () => {
    const session = await sessionRepository.start('work', '')
    const day = await db.days.get(session.dayKey)
    expect(day?.startedAt).toBe(session.startedAt)
  })
})

describe('rewardService.recordDashboardVisit', () => {
  it('completes day 3 only on the third challenge day', async () => {
    const today = toDayKey(Date.now())

    await prefsRepository.set('challenge', {
      startDate: addDays(today, -2), // today is day 3 (index 2)
      completed: [true, true, false],
    })
    await rewardService.recordDashboardVisit(today)
    expect((await prefsRepository.get('challenge'))?.completed).toEqual([true, true, true])

    await prefsRepository.set('challenge', { startDate: today, completed: [false, false, false] })
    await rewardService.recordDashboardVisit(today) // today is day 1 — no-op
    expect((await prefsRepository.get('challenge'))?.completed).toEqual([false, false, false])
  })
})
