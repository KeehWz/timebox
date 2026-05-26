import { describe, it, expect } from 'vitest'
import { activeMs, longestPauseMs, pauseCount, totalPausedMs, totalSpanMs } from './metrics'
import type { Session } from './session'

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 't',
    categoryId: 'work',
    note: '',
    startedAt: 0,
    endedAt: null,
    pauses: [],
    status: 'active',
    dayKey: '1970-01-01',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('totalSpanMs', () => {
  it('uses now while running', () => {
    expect(totalSpanMs(makeSession({ startedAt: 0 }), 60_000)).toBe(60_000)
  })
  it('uses endedAt when completed', () => {
    const s = makeSession({ startedAt: 0, endedAt: 50_000, status: 'completed' })
    expect(totalSpanMs(s, 99_999)).toBe(50_000)
  })
})

describe('totalPausedMs', () => {
  it('is 0 with no pauses', () => {
    expect(totalPausedMs(makeSession(), 10_000)).toBe(0)
  })
  it('counts an open pause up to now', () => {
    const s = makeSession({ pauses: [{ pausedAt: 30_000, resumedAt: null }] })
    expect(totalPausedMs(s, 90_000)).toBe(60_000)
  })
  it('sums multiple closed pauses', () => {
    const s = makeSession({
      pauses: [
        { pausedAt: 10_000, resumedAt: 15_000 },
        { pausedAt: 20_000, resumedAt: 23_000 },
      ],
    })
    expect(totalPausedMs(s, 100_000)).toBe(8_000)
  })
})

describe('activeMs', () => {
  it('equals span when never paused', () => {
    expect(activeMs(makeSession({ startedAt: 0 }), 60_000)).toBe(60_000)
  })
  it('freezes during an open pause', () => {
    const s = makeSession({ startedAt: 0, pauses: [{ pausedAt: 30_000, resumedAt: null }] })
    expect(activeMs(s, 90_000)).toBe(30_000)
    expect(activeMs(s, 120_000)).toBe(30_000) // still frozen later
  })
  it('resumes after a closed pause', () => {
    const s = makeSession({ startedAt: 0, pauses: [{ pausedAt: 30_000, resumedAt: 50_000 }] })
    expect(activeMs(s, 90_000)).toBe(70_000) // 90s span − 20s paused
  })
  it('clamps to 0 on negative skew', () => {
    const s = makeSession({ startedAt: 100_000, endedAt: 90_000, status: 'completed' })
    expect(activeMs(s, 0)).toBe(0)
  })
})

describe('pauseCount / longestPauseMs', () => {
  it('counts pauses', () => {
    const s = makeSession({
      pauses: [
        { pausedAt: 1, resumedAt: 2 },
        { pausedAt: 3, resumedAt: 4 },
      ],
    })
    expect(pauseCount(s)).toBe(2)
  })
  it('finds the longest pause', () => {
    const s = makeSession({
      pauses: [
        { pausedAt: 0, resumedAt: 5_000 },
        { pausedAt: 10_000, resumedAt: 22_000 },
        { pausedAt: 30_000, resumedAt: 33_000 },
      ],
    })
    expect(longestPauseMs(s, 100_000)).toBe(12_000)
  })
  it('returns 0 for no pauses', () => {
    expect(longestPauseMs(makeSession(), 100_000)).toBe(0)
  })
})
