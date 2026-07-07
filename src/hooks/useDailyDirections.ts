import { useLiveQuery } from 'dexie-react-hooks'
import { dailyDirectionRepository } from '../data/dailyDirectionRepository'
import { orderDirections } from '../domain/dailyDirection'
import type { DailyDirection } from '../domain/dailyDirection'

/** Live, display-ordered directions for a day. `undefined` while loading. */
export function useDailyDirections(dayKey: string): DailyDirection[] | undefined {
  return useLiveQuery(
    async () => orderDirections(await dailyDirectionRepository.listByDate(dayKey)),
    [dayKey],
  )
}
