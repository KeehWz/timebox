import { describe, it, expect } from 'vitest'
import { achievedMilestones, milestoneId } from './milestone'
import type { Session } from './session'

const MINUTE = 60_000

function completedSession(overrides: Partial<Session>): Session {
  return {
    id: 'id',
    type: 'standard',
    categoryId: 'work',
    note: '',
    startedAt: 0,
    endedAt: 10 * MINUTE,
    pauses: [],
    status: 'completed',
    dayKey: '2026-07-06',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

describe('achievedMilestones', () => {
  it('is empty with no completed sessions', () => {
    expect(achievedMilestones([], 0)).toEqual([])
    expect(
      achievedMilestones([completedSession({ status: 'active', endedAt: null })], 0),
    ).toEqual([])
  })

  it('fires first_session with one completed session', () => {
    expect(achievedMilestones([completedSession({})], 10 * MINUTE)).toEqual(['first_session'])
  })

  it('fires one_hour when completed focus time reaches 60 minutes', () => {
    const sessions = [
      completedSession({ id: 'a', startedAt: 0, endedAt: 40 * MINUTE }),
      completedSession({ id: 'b', startedAt: 60 * MINUTE, endedAt: 80 * MINUTE }),
    ]
    expect(achievedMilestones(sessions, 80 * MINUTE)).toEqual(['first_session', 'one_hour'])
  })

  it('excludes paused time from the one_hour total', () => {
    const sessions = [
      completedSession({
        startedAt: 0,
        endedAt: 60 * MINUTE,
        pauses: [{ pausedAt: 0, resumedAt: 5 * MINUTE }],
      }),
    ]
    expect(achievedMilestones(sessions, 60 * MINUTE)).toEqual(['first_session'])
  })

  it('fires five_sessions at the fifth completed session', () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      completedSession({ id: `s${i}`, startedAt: i * MINUTE, endedAt: i * MINUTE + 30_000 }),
    )
    expect(achievedMilestones(sessions, 10 * MINUTE)).toContain('five_sessions')
  })
})

describe('milestoneId', () => {
  it('is stable per day + kind', () => {
    expect(milestoneId('2026-07-06', 'one_hour')).toBe('2026-07-06:one_hour')
  })
})
