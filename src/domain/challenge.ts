/**
 * Three-day starter challenge (spec §17): day 1 record a session, day 2 record another,
 * day 3 review the dashboard. Progress is stored explicitly (prefs) and marked at the
 * relevant write points, so rendering never needs cross-day queries.
 */
export interface ChallengeProgress {
  startDate: string // local 'YYYY-MM-DD' — the day onboarding completed
  completed: [boolean, boolean, boolean]
}

const MS_PER_DAY = 86_400_000

/** 0-based challenge day index for a dayKey, e.g. startDate itself = 0. Negative = before. */
export function challengeDayIndex(startDate: string, dayKey: string): number {
  const toUtcMidnight = (key: string): number => {
    const [year, month, day] = key.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  return Math.round((toUtcMidnight(dayKey) - toUtcMidnight(startDate)) / MS_PER_DAY)
}

/** Show the challenge card while today is within the 3-day window and it isn't finished. */
export function isChallengeVisible(challenge: ChallengeProgress, todayKey: string): boolean {
  const index = challengeDayIndex(challenge.startDate, todayKey)
  if (index < 0 || index > 2) return false
  return !challenge.completed.every(Boolean)
}
