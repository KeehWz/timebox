import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import type { FocusType } from '../domain/focusType'

/** User-created focus types, oldest first (stable picker order). undefined while loading. */
export function useFocusTypes(): FocusType[] | undefined {
  return useLiveQuery(() => db.focusTypes.orderBy('createdAt').toArray(), [])
}
