import { describe, expect, it } from 'vitest'
import { planNotifications, reminderMinutes, SESSION_NUDGE_ID, UNMARKED_ID, unmarkedMinutes } from './notifications'
import { DEFAULT_SETTINGS } from './defaults'
import type { ActiveSession, Session } from './types'

const MIN = 60_000
const at = (h: number, m = 0) => new Date(2026, 10, 10, h, m).getTime()

const day = { started: true, startTime: at(9), endTime: 0 }
const settings = { ...DEFAULT_SETTINGS, nudgeAfter: '90' }
const active = (overrides: Partial<ActiveSession> = {}): ActiveSession => ({
  typeId: 'work',
  typeName: 'Work',
  description: '',
  startTime: at(10),
  pausedDuration: 0,
  isPaused: false,
  focusEnabled: false,
  reminder: '60m',
  ...overrides,
})
const session = (start: number, end: number): Session => ({
  id: String(start),
  typeId: 'work',
  typeName: 'Work',
  description: '',
  startTime: start,
  endTime: end,
  pausedDuration: 0,
})

describe('reading the settings', () => {
  it('parses the session reminder', () => {
    expect(reminderMinutes('')).toBe(0)
    expect(reminderMinutes('Off')).toBe(0)
    expect(reminderMinutes('60m')).toBe(60)
    expect(reminderMinutes('2h')).toBe(120)
    expect(reminderMinutes('custom-45m')).toBe(45)
  })

  it('parses the unmarked-time reminder', () => {
    expect(unmarkedMinutes({ ...settings, nudgeAfter: 'off' })).toBe(0)
    expect(unmarkedMinutes({ ...settings, nudgeAfter: '120' })).toBe(120)
    expect(unmarkedMinutes({ ...settings, nudgeAfter: 'custom', customNudgeMinutes: 45 })).toBe(45)
  })
})

describe('session nudge', () => {
  it('checks in once the session has run for the chosen time', () => {
    expect(planNotifications({ day, active: active(), sessions: [], settings }, at(10, 5))).toEqual([
      { id: SESSION_NUDGE_ID, at: at(11), title: 'Work', body: 'A gentle check-in — 1h so far.' },
    ])
  })

  it('does not count paused time, and has nothing pending while paused', () => {
    const resumed = active({ pausedDuration: 15 * MIN })
    expect(planNotifications({ day, active: resumed, sessions: [], settings }, at(10, 30))[0].at).toBe(at(11, 15))
    const paused = active({ isPaused: true, pauseStart: at(10, 20) })
    expect(planNotifications({ day, active: paused, sessions: [], settings }, at(10, 30))).toEqual([])
  })

  it('is not planned without a reminder, or once its moment has passed', () => {
    expect(planNotifications({ day, active: active({ reminder: '' }), sessions: [], settings }, at(10, 5))).toEqual([])
    expect(planNotifications({ day, active: active(), sessions: [], settings }, at(11, 1))).toEqual([])
  })
})

describe('unmarked-time reminder', () => {
  it('counts from the last recording of today', () => {
    const sessions = [session(at(8), at(8, 30)), session(at(9, 30), at(10)), session(at(10, 15), at(11))]
    expect(planNotifications({ day, active: null, sessions, settings }, at(11, 5))).toEqual([
      { id: UNMARKED_ID, at: at(12, 30), title: 'TimeBox', body: 'Ready to mark your time?' },
    ])
  })

  it('counts from Start Today when nothing is recorded yet', () => {
    expect(planNotifications({ day, active: null, sessions: [], settings }, at(9, 1))[0].at).toBe(at(10, 30))
  })

  it('is replaced by the session nudge while recording', () => {
    const planned = planNotifications({ day, active: active(), sessions: [], settings }, at(10, 5))
    expect(planned.map(item => item.id)).toEqual([SESSION_NUDGE_ID])
  })

  it('stays quiet at night', () => {
    const late = { started: true, startTime: at(20, 31), endTime: 0 }
    expect(planNotifications({ day: late, active: null, sessions: [], settings }, at(20, 35))).toEqual([]) // 22:01
    const early = { started: true, startTime: at(5, 0), endTime: 0 }
    expect(planNotifications({ day: early, active: null, sessions: [], settings }, at(5, 1))).toEqual([]) // 06:30
    const evening = { started: true, startTime: at(20, 29), endTime: 0 }
    expect(planNotifications({ day: evening, active: null, sessions: [], settings }, at(20, 35))).toHaveLength(1) // 21:59
  })

  it('is not planned when turned off, before Start Today, or after End Today', () => {
    expect(planNotifications({ day, active: null, sessions: [], settings: { ...settings, nudgeAfter: 'off' } }, at(9, 1))).toEqual([])
    expect(planNotifications({ day: { started: false, startTime: 0, endTime: 0 }, active: null, sessions: [], settings }, at(9, 1))).toEqual([])
    expect(planNotifications({ day: { ...day, endTime: at(9, 30) }, active: null, sessions: [], settings }, at(9, 31))).toEqual([])
  })

  it('is not planned once its moment has passed', () => {
    expect(planNotifications({ day, active: null, sessions: [], settings }, at(10, 31))).toEqual([])
  })
})
