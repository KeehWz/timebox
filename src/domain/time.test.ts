import { describe, expect, it } from 'vitest'
import {
  activeElapsed,
  addCalendarDays,
  finishActive,
  isStaleDay,
  localDateKey,
  pauseActive,
  resumeActive,
  roughAmountMinutes,
  sessionDuration,
  startOfCalendarWeek,
  sumSessionMs,
  summarizeDirectionItems,
} from './time'
import type { ActiveSession, Session } from './types'

const MIN = 60_000
const at = (h: number, m = 0, day = 10) => new Date(2026, 10, day, h, m).getTime()

const active = (overrides: Partial<ActiveSession> = {}): ActiveSession => ({
  typeId: 'work',
  typeName: 'Work',
  description: '',
  startTime: at(9),
  pausedDuration: 0,
  isPaused: false,
  focusEnabled: false,
  reminder: '',
  ...overrides,
})

const session = (overrides: Partial<Session> = {}): Session => ({
  id: 's',
  typeId: 'work',
  typeName: 'Work',
  description: '',
  startTime: at(9),
  endTime: at(10),
  pausedDuration: 0,
  ...overrides,
})

describe('calendar helpers', () => {
  it('starts the week on Monday, including for a Sunday', () => {
    // 2026-11-15 is a Sunday → week starts Monday 2026-11-09
    expect(localDateKey(startOfCalendarWeek(new Date(2026, 10, 15, 18)))).toBe('2026-11-09')
    expect(localDateKey(startOfCalendarWeek(new Date(2026, 10, 9, 0)))).toBe('2026-11-09')
  })

  it('adds days across a month boundary at midnight', () => {
    const next = addCalendarDays(new Date(2026, 10, 30, 15), 1)
    expect(localDateKey(next)).toBe('2026-12-01')
    expect(next.getHours()).toBe(0)
  })
})

describe('active session', () => {
  it('derives elapsed time from timestamps', () => {
    expect(activeElapsed(active(), at(9, 30))).toBe(30 * MIN)
  })

  it('freezes elapsed while paused and excludes the pause after resuming', () => {
    const paused = pauseActive(active(), at(9, 20))
    expect(activeElapsed(paused, at(9, 50))).toBe(20 * MIN)

    const resumed = resumeActive(paused, at(9, 50))
    expect(resumed.isPaused).toBe(false)
    expect(resumed.pausedDuration).toBe(30 * MIN)
    expect(activeElapsed(resumed, at(10))).toBe(30 * MIN)
  })

  it('ignores a second pause or a resume when not paused', () => {
    const paused = pauseActive(active(), at(9, 20))
    expect(pauseActive(paused, at(9, 40))).toBe(paused)
    const running = active()
    expect(resumeActive(running, at(9, 40))).toBe(running)
  })

  it('finishes a running session', () => {
    const finished = finishActive(active({ description: 'Report' }), at(10), 'id-1')
    expect(finished).toEqual({
      id: 'id-1',
      typeId: 'work',
      typeName: 'Work',
      description: 'Report',
      startTime: at(9),
      endTime: at(10),
      pausedDuration: 0,
    })
  })

  it('counts an open pause as paused time when ending while paused', () => {
    const paused = pauseActive(active(), at(9, 40))
    const finished = finishActive(paused, at(10), 'id-2')
    expect(finished.pausedDuration).toBe(20 * MIN)
    expect(sessionDuration(finished)).toBe(40 * MIN)
  })

  it('records focused duration only for focus sessions', () => {
    const resumed = resumeActive(pauseActive(active({ focusEnabled: true }), at(9, 10)), at(9, 20))
    expect(finishActive(resumed, at(10), 'id-3').focusedDuration).toBe(50 * MIN)
    expect(finishActive(active(), at(10), 'id-4')).not.toHaveProperty('focusedDuration')
  })
})

describe('session totals', () => {
  it('sums one category since the day started', () => {
    const sessions = [
      session({ id: 'a', startTime: at(7), endTime: at(8) }), // before day start
      session({ id: 'b', startTime: at(9), endTime: at(10), pausedDuration: 15 * MIN }),
      session({ id: 'c', typeId: 'exercise', startTime: at(11), endTime: at(12) }),
      session({ id: 'd', startTime: at(13), endTime: at(13, 30) }),
    ]
    expect(sumSessionMs(sessions, 'work', at(8, 30))).toBe(75 * MIN)
  })

  it('never reports a negative duration', () => {
    expect(sessionDuration(session({ pausedDuration: 2 * 60 * MIN }))).toBe(0)
  })
})

describe('isStaleDay', () => {
  const day = { started: true, startTime: at(9), endTime: 0 }

  it('keeps a late night in the day it started', () => {
    expect(isStaleDay(day, at(23, 30))).toBe(false)
    expect(isStaleDay(day, at(2, 0, 11))).toBe(false)
  })

  it('is stale once the next 4am has passed', () => {
    expect(isStaleDay(day, at(4, 1, 11))).toBe(true)
    expect(isStaleDay(day, at(9, 0, 12))).toBe(true)
  })

  it('treats a day started after midnight as part of the previous night', () => {
    const lateStart = { started: true, startTime: at(1, 0, 11), endTime: 0 }
    expect(isStaleDay(lateStart, at(3, 0, 11))).toBe(false)
    expect(isStaleDay(lateStart, at(5, 0, 11))).toBe(true)
  })

  it('is never stale when not started or already ended', () => {
    expect(isStaleDay({ started: false, startTime: 0, endTime: 0 }, at(9, 0, 20))).toBe(false)
    expect(isStaleDay({ ...day, endTime: at(22) }, at(9, 0, 12))).toBe(false)
  })
})

describe('direction amounts', () => {
  it('parses rough amounts', () => {
    expect(roughAmountMinutes('30m')).toBe(30)
    expect(roughAmountMinutes('2h')).toBe(120)
    expect(roughAmountMinutes('no amount')).toBe(0)
  })

  it('summarises items into one amount', () => {
    expect(summarizeDirectionItems([])).toBe('no amount')
    expect(summarizeDirectionItems([{ preset: null, roughAmount: 'no amount' }])).toBe('no amount')
    expect(
      summarizeDirectionItems([
        { preset: null, roughAmount: '1h' },
        { preset: 'Gym', roughAmount: '45m' },
      ]),
    ).toBe('1h 45m')
    expect(summarizeDirectionItems([{ preset: null, roughAmount: '30m' }, { preset: 'Run', roughAmount: '90m' }])).toBe('2h')
    expect(summarizeDirectionItems([{ preset: null, roughAmount: '45m' }])).toBe('45m')
  })
})
