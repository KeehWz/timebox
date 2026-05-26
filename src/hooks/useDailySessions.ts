import { useLiveQuery } from 'dexie-react-hooks'
import { sessionRepository } from '../data/sessionRepository'
import type { Session } from '../domain/session'

/** Live list of sessions for a local day (ordered by start). `undefined` while loading. */
export function useDailySessions(dayKey: string): Session[] | undefined {
  return useLiveQuery(() => sessionRepository.listByDay(dayKey), [dayKey])
}
