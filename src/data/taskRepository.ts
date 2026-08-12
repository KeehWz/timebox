import { db } from './db'
import type { Task } from '../domain/task'
import { nextEstimate } from '../domain/task'
import { newId } from '../lib/id'
import { TaskNotFoundError } from '../lib/errors'

async function requireTask(id: string): Promise<Task> {
  const task = await db.tasks.get(id)
  if (!task) throw new TaskNotFoundError(id)
  return task
}

async function patch(id: string, changes: Partial<Task>): Promise<Task> {
  const task = await requireTask(id)
  const next: Task = { ...task, ...changes, updatedAt: Date.now() }
  await db.tasks.put(next)
  return next
}

/** Inbox tasks (design: Timebox.dc.html). Every write stores a NEW object (immutability). */
export const taskRepository = {
  async add(title: string): Promise<Task> {
    const trimmed = title.trim()
    if (!trimmed) throw new Error('Task title must not be empty')
    const now = Date.now()
    const task: Task = {
      id: newId(),
      title: trimmed,
      estimateMin: 30,
      dayKey: null,
      startMin: null,
      doneAt: null,
      createdAt: now,
      updatedAt: now,
    }
    await db.tasks.add(task)
    return task
  },

  /** Cycle the estimate chip: 25 → 30 → 45 → 60 → 90 → 25 … */
  cycleEstimate(id: string): Promise<Task> {
    return db.transaction('rw', db.tasks, async () => {
      const task = await requireTask(id)
      return patch(id, { estimateMin: nextEstimate(task.estimateMin) })
    })
  },

  setDone(id: string, done: boolean): Promise<Task> {
    return patch(id, { doneAt: done ? Date.now() : null })
  },

  /** Place the task on a day's timeline at the given minute-of-day. */
  schedule(id: string, dayKey: string, startMin: number): Promise<Task> {
    return patch(id, { dayKey, startMin })
  },

  /** Move a scheduled task within its day (drag on the timeline). */
  move(id: string, startMin: number): Promise<Task> {
    return patch(id, { startMin })
  },

  unschedule(id: string): Promise<Task> {
    return patch(id, { dayKey: null, startMin: null })
  },

  get(id: string): Promise<Task | undefined> {
    return db.tasks.get(id)
  },
}
