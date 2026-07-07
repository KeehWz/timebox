import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import type { Milestone } from '../domain/milestone'

/** Live milestones earned on a day. `undefined` while loading. */
export function useDayMilestones(dayKey: string | undefined): Milestone[] | undefined {
  return useLiveQuery<Milestone[]>(
    () =>
      dayKey
        ? db.milestones.where('dayKey').equals(dayKey).toArray()
        : Promise.resolve<Milestone[]>([]),
    [dayKey],
  )
}
