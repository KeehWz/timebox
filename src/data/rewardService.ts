import { db } from './db'
import { prefsRepository } from './prefsRepository'
import { achievedMilestones, milestoneId } from '../domain/milestone'
import { challengeDayIndex } from '../domain/challenge'
import type { ChallengeProgress } from '../domain/challenge'
import type { Session } from '../domain/session'

/**
 * Reward layer (spec §13) + three-day challenge progress (spec §17).
 * Called from the write paths so rewards fire exactly once regardless of which screen
 * is open. Milestone `firedAt` is set to the triggering session's endedAt, which lets the
 * summary screen identify "earned by THIS session" without extra bookkeeping.
 */
export const rewardService = {
  /** Evaluate milestones + challenge after a session completes. Runs inside end()'s transaction. */
  async onSessionCompleted(session: Session): Promise<void> {
    const firedAt = session.endedAt ?? Date.now()

    const daySessions = await db.sessions.where('dayKey').equals(session.dayKey).toArray()
    for (const kind of achievedMilestones(daySessions, firedAt)) {
      const id = milestoneId(session.dayKey, kind)
      if (!(await db.milestones.get(id))) {
        await db.milestones.add({ id, kind, dayKey: session.dayKey, firedAt })
      }
    }

    // Challenge days 1 & 2: record a session.
    const challenge = await prefsRepository.get('challenge')
    if (!challenge) return
    const index = challengeDayIndex(challenge.startDate, session.dayKey)
    if ((index === 0 || index === 1) && !challenge.completed[index]) {
      const completed = [...challenge.completed] as ChallengeProgress['completed']
      completed[index] = true
      await prefsRepository.set('challenge', { ...challenge, completed })
    }
  },

  /** Challenge day 3: review the dashboard. Called when the daily screen shows today. */
  async recordDashboardVisit(dayKey: string): Promise<void> {
    const challenge = await prefsRepository.get('challenge')
    if (!challenge) return
    if (challengeDayIndex(challenge.startDate, dayKey) !== 2 || challenge.completed[2]) return
    const completed = [...challenge.completed] as ChallengeProgress['completed']
    completed[2] = true
    await prefsRepository.set('challenge', { ...challenge, completed })
  },
}
