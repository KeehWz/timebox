import { useLiveQuery } from 'dexie-react-hooks'
import { checkInRepository } from '../data/checkInRepository'
import type { CheckIn } from '../domain/checkIn'

/** The live open check-in. `undefined` while loading, `null` if none. */
export function useOpenCheckIn(): CheckIn | null | undefined {
  return useLiveQuery(() => checkInRepository.getOpen())
}
