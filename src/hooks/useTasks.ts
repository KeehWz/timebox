import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../data/db'
import type { Task } from '../domain/task'

/** All tasks, live. undefined while loading. Screens slice with domain/task helpers. */
export function useTasks(): Task[] | undefined {
  return useLiveQuery(() => db.tasks.toArray(), [])
}
