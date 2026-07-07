import { useLiveQuery } from 'dexie-react-hooks'
import { checkInRepository } from '../data/checkInRepository'
import type { CheckIn } from '../domain/checkIn'

/** Live check-ins for a local day, ordered by start. `undefined` while loading. */
export function useDailyCheckIns(dayKey: string): CheckIn[] | undefined {
  return useLiveQuery(() => checkInRepository.listByDay(dayKey), [dayKey])
}
