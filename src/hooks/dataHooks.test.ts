import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '../data/db'
import { dayRepository } from '../data/dayRepository'
import { dailyDirectionRepository } from '../data/dailyDirectionRepository'
import { prefsRepository } from '../data/prefsRepository'
import { sessionRepository } from '../data/sessionRepository'
import { useDay } from './useDay'
import { useDailyDirections } from './useDailyDirections'
import { useDayMilestones } from './useDayMilestones'
import { usePref } from './usePref'
import { useTodayStats } from './useTodayStats'

beforeEach(async () => {
  await Promise.all([
    db.sessions.clear(),
    db.categoryStats.clear(),
    db.days.clear(),
    db.dailyDirections.clear(),
    db.prefs.clear(),
    db.milestones.clear(),
  ])
})

describe('useDay', () => {
  it('is null for an untouched day and live-updates on start', async () => {
    const { result } = renderHook(() => useDay('2026-07-06'))
    await waitFor(() => expect(result.current).toBeNull())
    await dayRepository.ensureStarted('2026-07-06', 123)
    await waitFor(() => expect(result.current?.startedAt).toBe(123))
  })
})

describe('useDailyDirections', () => {
  it('returns the day directions in catalog order', async () => {
    await dailyDirectionRepository.setForDate('2026-07-06', [
      { categoryId: 'other', targetDurationMs: null },
      { categoryId: 'work', targetDurationMs: 60_000 },
    ])
    const { result } = renderHook(() => useDailyDirections('2026-07-06'))
    await waitFor(() =>
      expect(result.current?.map((d) => d.categoryId)).toEqual(['work', 'other']),
    )
  })
})

describe('useDayMilestones', () => {
  it('is empty without a dayKey', async () => {
    const { result } = renderHook(() => useDayMilestones(undefined))
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it('lists milestones for the day', async () => {
    await db.milestones.add({
      id: '2026-07-06:first_session',
      kind: 'first_session',
      dayKey: '2026-07-06',
      firedAt: 1,
    })
    const { result } = renderHook(() => useDayMilestones('2026-07-06'))
    await waitFor(() => expect(result.current?.map((m) => m.kind)).toEqual(['first_session']))
  })
})

describe('usePref', () => {
  it('is undefined before set and live-updates after', async () => {
    const { result } = renderHook(() => usePref('onboardingCompleted'))
    await waitFor(() => expect(result.current).toBeUndefined())
    await prefsRepository.set('onboardingCompleted', true)
    await waitFor(() => expect(result.current).toBe(true))
  })
})

describe('useTodayStats', () => {
  it('rolls up today from the live session list', async () => {
    const now = Date.now()
    const { result } = renderHook(() => useTodayStats(now))
    await waitFor(() => expect(result.current?.hasSession).toBe(false))

    await sessionRepository.start('work', '')
    await waitFor(() => expect(result.current?.sessionCount).toBe(1))
    expect(result.current?.lastCategoryId).toBe('work')
  })
})
