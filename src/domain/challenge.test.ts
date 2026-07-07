import { describe, it, expect } from 'vitest'
import { challengeDayIndex, isChallengeVisible } from './challenge'
import type { ChallengeProgress } from './challenge'

function challenge(overrides: Partial<ChallengeProgress> = {}): ChallengeProgress {
  return { startDate: '2026-07-06', completed: [false, false, false], ...overrides }
}

describe('challengeDayIndex', () => {
  it('is 0 on the start date and counts forward', () => {
    expect(challengeDayIndex('2026-07-06', '2026-07-06')).toBe(0)
    expect(challengeDayIndex('2026-07-06', '2026-07-07')).toBe(1)
    expect(challengeDayIndex('2026-07-06', '2026-07-08')).toBe(2)
  })

  it('handles month boundaries and past days', () => {
    expect(challengeDayIndex('2026-06-30', '2026-07-01')).toBe(1)
    expect(challengeDayIndex('2026-07-06', '2026-07-05')).toBe(-1)
  })
})

describe('isChallengeVisible', () => {
  it('is visible inside the 3-day window while incomplete', () => {
    expect(isChallengeVisible(challenge(), '2026-07-06')).toBe(true)
    expect(isChallengeVisible(challenge(), '2026-07-08')).toBe(true)
  })

  it('hides outside the window', () => {
    expect(isChallengeVisible(challenge(), '2026-07-05')).toBe(false)
    expect(isChallengeVisible(challenge(), '2026-07-09')).toBe(false)
  })

  it('hides once every step is done', () => {
    expect(
      isChallengeVisible(challenge({ completed: [true, true, true] }), '2026-07-07'),
    ).toBe(false)
  })
})
