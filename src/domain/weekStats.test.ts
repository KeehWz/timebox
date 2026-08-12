import { describe, it, expect } from 'vitest'
import { weekDayKeys, focusMsByDay, currentStreak } from './weekStats'
import { addDays, toDayKey } from './time'
import type { Session } from './session'

function mkSession(overrides: Partial<Session>): Session {
  const startedAt = overrides.startedAt ?? Date.now()
  return {
    id: 's1',
    type: 'standard',
    categoryId: 'work',
    note: '',
    startedAt,
    endedAt: startedAt + 60_000,
    pauses: [],
    status: 'completed',
    dayKey: toDayKey(startedAt),
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides,
  }
}

describe('weekDayKeys', () => {
  it('returns Monday..Sunday containing now', () => {
    // 2026-07-18 is a Saturday
    const sat = new Date(2026, 6, 18, 12).getTime()
    const keys = weekDayKeys(sat)
    expect(keys).toHaveLength(7)
    expect(keys[0]).toBe('2026-07-13') // Monday
    expect(keys[5]).toBe('2026-07-18')
    expect(keys[6]).toBe('2026-07-19')
  })
})

describe('focusMsByDay', () => {
  it('rolls completed focus into each day and counts a running session live', () => {
    const now = Date.now()
    const done = mkSession({ id: 'a', dayKey: '2026-07-17' })
    const running = mkSession({
      id: 'b',
      dayKey: '2026-07-18',
      startedAt: now - 120_000,
      endedAt: null,
      status: 'active',
    })
    const byDay = focusMsByDay([done, running], now)
    expect(byDay['2026-07-17']).toBe(60_000)
    expect(byDay['2026-07-18']).toBeGreaterThanOrEqual(120_000)
  })
})

describe('currentStreak', () => {
  const today = '2026-07-18'

  it('counts consecutive focused days back from today', () => {
    const byDay = {
      [today]: 100,
      [addDays(today, -1)]: 100,
      [addDays(today, -2)]: 100,
      [addDays(today, -4)]: 100,
    }
    expect(currentStreak(byDay, today)).toBe(3)
  })

  it('does not break the streak on an untouched morning', () => {
    const byDay = { [addDays(today, -1)]: 100, [addDays(today, -2)]: 100 }
    expect(currentStreak(byDay, today)).toBe(2)
  })

  it('is zero with no recent focus', () => {
    expect(currentStreak({}, today)).toBe(0)
  })
})
