import { useLiveQuery } from 'dexie-react-hooks'
import { sessionRepository } from '../data/sessionRepository'
import type { Session } from '../domain/session'

/**
 * Live active/paused session.
 * `undefined` = still loading, `null` = none in progress, otherwise the Session.
 */
export function useActiveSession(): Session | null | undefined {
  return useLiveQuery(() => sessionRepository.getActive())
}
