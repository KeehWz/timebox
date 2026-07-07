import { useLiveQuery } from 'dexie-react-hooks'
import { dayRepository } from '../data/dayRepository'
import type { Day } from '../domain/day'

/** Live Day record for a dayKey. `undefined` while loading, `null` if never touched. */
export function useDay(dayKey: string): Day | null | undefined {
  return useLiveQuery(() => dayRepository.get(dayKey), [dayKey])
}
