import { describe, it, expect } from 'vitest'
import { computeTodayStats } from './todayStats'
import type { Session } from './session'

const HOUR = 3_600_000
const MINUTE = 60_000

function makeSession(overrides: Partial<Session>): Session {
  return {
    id: 'id',
    type: 'standard',
    categoryId: 'work',
    note: '',
    startedAt: 0,
    endedAt: null,
    pauses: [],
    status: 'active',
    dayKey: '2026-07-06',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('computeTodayStats', () => {
  it('reports State A (no sessions) as empty', () => {
    const stats = computeTodayStats([], Date.now())
    expect(stats.hasSession).toBe(false)
    expect(stats.sessionCount).toBe(0)
    expect(stats.totalTrackedMs).toBe(0)
    expect(stats.lastCategoryId).toBeNull()
  })

  it('sums focus time, excluding pauses', () => {
    const completed = makeSession({
      id: 'a',
      startedAt: 0,
      endedAt: HOUR,
      pauses: [{ pausedAt: 10 * MINUTE, resumedAt: 20 * MINUTE }],
      status: 'completed',
    })
    const stats = computeTodayStats([completed], 2 * HOUR)
    expect(stats.sessionCount).toBe(1)
    expect(stats.totalTrackedMs).toBe(50 * MINUTE) // 1h span − 10m paused
  })

  it('counts a running session up to now and reports the latest category', () => {
    const completed = makeSession({
      id: 'a',
      categoryId: 'study',
      startedAt: 0,
      endedAt: HOUR,
      status: 'completed',
    })
    const running = makeSession({ id: 'b', categoryId: 'work', startedAt: 2 * HOUR })
    const now = 2 * HOUR + 15 * MINUTE
    const stats = computeTodayStats([completed, running], now)
    expect(stats.hasSession).toBe(true)
    expect(stats.sessionCount).toBe(2)
    expect(stats.totalTrackedMs).toBe(HOUR + 15 * MINUTE)
    expect(stats.lastCategoryId).toBe('work') // most recently started
  })
})
