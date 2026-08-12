import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import type { Session } from '../domain/session'
import { weekDayKeys } from '../domain/weekStats'
import { toDayKey } from '../domain/time'

/** Sessions of the week containing `now` (Mon–Sun), live. undefined while loading. */
export function useWeekSessions(now: number): Session[] | undefined {
  const today = toDayKey(now)
  // deps: re-query when the local day flips, not on every tick of `now`
  return useLiveQuery(() => {
    const keys = weekDayKeys(now)
    return db.sessions.where('dayKey').anyOf(keys).toArray()
  }, [today])
}
