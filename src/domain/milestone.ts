import type { Session } from './session'
import { activeMs } from './metrics'

/** Lightweight daily reward events (spec §13). Each fires at most once per day. */
export type MilestoneKind = 'first_session' | 'one_hour' | 'five_sessions'

export interface Milestone {
  id: string // `${dayKey}:${kind}` — natural key prevents refiring
  kind: MilestoneKind
  dayKey: string
  firedAt: number // epoch ms; set to the triggering session's endedAt
}

export const MILESTONE_KINDS: readonly MilestoneKind[] = [
  'first_session',
  'one_hour',
  'five_sessions',
]

const ONE_HOUR_MS = 3_600_000

/**
 * Which milestones a day's sessions currently satisfy (pure; only completed sessions count).
 * The caller diffs against already-persisted milestones to find newly earned ones.
 */
export function achievedMilestones(
  sessions: readonly Session[],
  now: number,
): MilestoneKind[] {
  const completed = sessions.filter((s) => s.status === 'completed')
  const kinds: MilestoneKind[] = []
  if (completed.length >= 1) kinds.push('first_session')
  const focusTotal = completed.reduce((sum, s) => sum + activeMs(s, now), 0)
  if (focusTotal >= ONE_HOUR_MS) kinds.push('one_hour')
  if (completed.length >= 5) kinds.push('five_sessions')
  return kinds
}

export function milestoneId(dayKey: string, kind: MilestoneKind): string {
  return `${dayKey}:${kind}`
}
