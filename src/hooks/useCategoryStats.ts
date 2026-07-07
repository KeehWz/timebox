import { useLiveQuery } from 'dexie-react-hooks'
import { categoryStatsRepository } from '../data/categoryStatsRepository'
import type { CategoryStats } from '../domain/categoryStats'

/** Live category usage stats (recents / favorites). `undefined` while loading. */
export function useCategoryStats(): CategoryStats[] | undefined {
  return useLiveQuery(() => categoryStatsRepository.getAll())
}
