/**
 * A lightweight to-do captured in the Inbox (design: Timebox.dc.html). Tasks are optional
 * planning sugar on top of sessions: they can be scheduled onto the Today timeline and
 * started as a focus session (which stamps the session with `taskId`).
 */
export interface Task {
  id: string
  title: string
  estimateMin: number
  /** Local 'YYYY-MM-DD' the task is scheduled on; null = unscheduled (inbox only). */
  dayKey: string | null
  /** Minutes since local midnight when scheduled; null = unscheduled. */
  startMin: number | null
  /** Epoch ms when completed; null = open. */
  doneAt: number | null
  createdAt: number
  updatedAt: number
}

/** Estimate presets the chip cycles through (design: 25 → 30 → 45 → 60 → 90 → 25 …). */
export const ESTIMATE_CYCLE = [25, 30, 45, 60, 90] as const

export function nextEstimate(current: number): number {
  const index = ESTIMATE_CYCLE.indexOf(current as (typeof ESTIMATE_CYCLE)[number])
  return ESTIMATE_CYCLE[(index + 1) % ESTIMATE_CYCLE.length]
}

/** Open tasks, newest first (matches the design's prepend-on-add behavior). */
export function openTasks(tasks: readonly Task[]): Task[] {
  return tasks.filter((task) => task.doneAt === null).sort((a, b) => b.createdAt - a.createdAt)
}

/** Completed tasks, most recently finished first. */
export function doneTasks(tasks: readonly Task[]): Task[] {
  return tasks
    .filter((task) => task.doneAt !== null)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0))
}

/** Tasks scheduled on the given day, ordered by start time. */
export function scheduledTasks(tasks: readonly Task[], dayKey: string): Task[] {
  return tasks
    .filter((task) => task.dayKey === dayKey && task.startMin !== null)
    .sort((a, b) => (a.startMin ?? 0) - (b.startMin ?? 0))
}

/** Count of tasks completed on the given local day. */
export function doneCountOn(tasks: readonly Task[], dayKey: string, toDayKey: (ms: number) => string): number {
  return tasks.filter((task) => task.doneAt !== null && toDayKey(task.doneAt) === dayKey).length
}
