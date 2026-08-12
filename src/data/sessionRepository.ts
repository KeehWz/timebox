import { db } from './db'
import { categoryStatsRepository } from './categoryStatsRepository'
import { dayRepository } from './dayRepository'
import { rewardService } from './rewardService'
import type { Session, SessionType } from '../domain/session'
import { toDayKey } from '../domain/time'
import { newId } from '../lib/id'
import { ActiveSessionExistsError, SessionNotFoundError } from '../lib/errors'

/** The single active or paused session, or null if none. */
async function findActive(): Promise<Session | null> {
  const session = await db.sessions.where('status').anyOf('active', 'paused').first()
  return session ?? null
}

async function requireSession(id: string): Promise<Session> {
  const session = await db.sessions.get(id)
  if (!session) throw new SessionNotFoundError(id)
  return session
}

/**
 * All persistence goes through this repository. Every write produces a NEW session object
 * (immutability) and bumps `updatedAt`; the stored record is never mutated in place.
 */
export const sessionRepository = {
  /** Returns the active/paused session, or null. (null = none; callers treat undefined = loading.) */
  getActive(): Promise<Session | null> {
    return findActive()
  },

  /**
   * Start a new session. Guards against more than one in-flight session.
   * Same transaction also: records category usage (standard sessions only, so future drift
   * starts don't pollute recents) and implicitly starts the day (spec §4 — a session without
   * an explicit "Start Day" still opens the day record).
   */
  async start(
    categoryId: string,
    note: string,
    type: SessionType = 'standard',
    taskId?: string,
  ): Promise<Session> {
    return db.transaction('rw', db.sessions, db.categoryStats, db.days, async () => {
      if (await findActive()) throw new ActiveSessionExistsError()
      const now = Date.now()
      const session: Session = {
        id: newId(),
        type,
        categoryId,
        ...(taskId ? { taskId } : {}),
        note: note.trim(),
        startedAt: now,
        endedAt: null,
        pauses: [],
        status: 'active',
        dayKey: toDayKey(now),
        createdAt: now,
        updatedAt: now,
      }
      await db.sessions.add(session)
      if (type === 'standard') await categoryStatsRepository.recordUse(categoryId, now)
      await dayRepository.ensureStarted(session.dayKey, now)
      return session
    })
  },

  /** Begin a quick-pause. No-op if the session is not currently active. */
  async pause(id: string): Promise<void> {
    const session = await requireSession(id)
    if (session.status !== 'active') return
    const now = Date.now()
    const updated: Session = {
      ...session,
      status: 'paused',
      pauses: [...session.pauses, { pausedAt: now, resumedAt: null }],
      updatedAt: now,
    }
    await db.sessions.put(updated)
  },

  /** Resume from a quick-pause. No-op if the session is not currently paused. */
  async resume(id: string): Promise<void> {
    const session = await requireSession(id)
    if (session.status !== 'paused') return
    const now = Date.now()
    const lastIndex = session.pauses.length - 1
    const pauses = session.pauses.map((p, i) =>
      i === lastIndex && p.resumedAt === null ? { ...p, resumedAt: now } : p,
    )
    const updated: Session = { ...session, status: 'active', pauses, updatedAt: now }
    await db.sessions.put(updated)
  },

  /**
   * End the session. Closes any open pause at the end time, then marks it completed.
   * The same transaction evaluates the reward layer (milestones + challenge, spec §13/§17),
   * so rewards fire exactly once no matter which screen triggered the end.
   */
  async end(id: string): Promise<Session> {
    return db.transaction('rw', db.sessions, db.milestones, db.prefs, async () => {
      const session = await requireSession(id)
      const now = Date.now()
      const pauses = session.pauses.map((p) =>
        p.resumedAt === null ? { ...p, resumedAt: now } : p,
      )
      const ended: Session = {
        ...session,
        pauses,
        status: 'completed',
        endedAt: now,
        updatedAt: now,
      }
      await db.sessions.put(ended)
      await rewardService.onSessionCompleted(ended)
      return ended
    })
  },

  async getById(id: string): Promise<Session | null> {
    return (await db.sessions.get(id)) ?? null
  },

  /**
   * Convert a drift session into a categorized standard session (spec §9 — post-hoc
   * "convert to category" on the summary screen). No-op on non-drift sessions.
   * Deliberately does not bump categoryStats: recents should reflect deliberate starts.
   */
  async convertToCategory(id: string, categoryId: string): Promise<void> {
    const session = await requireSession(id)
    if (session.type !== 'drift') return
    const updated: Session = { ...session, type: 'standard', categoryId, updatedAt: Date.now() }
    await db.sessions.put(updated)
  },

  /** Sessions for a local day, ordered by start time. */
  listByDay(dayKey: string): Promise<Session[]> {
    return db.sessions.where('dayKey').equals(dayKey).sortBy('startedAt')
  },
}
