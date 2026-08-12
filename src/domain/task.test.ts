import { describe, it, expect } from 'vitest'
import {
  ESTIMATE_CYCLE,
  nextEstimate,
  openTasks,
  doneTasks,
  scheduledTasks,
  doneCountOn,
  type Task,
} from './task'
import { toDayKey } from './time'

function mkTask(overrides: Partial<Task>): Task {
  return {
    id: 't1',
    title: 'Task',
    estimateMin: 30,
    dayKey: null,
    startMin: null,
    doneAt: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('nextEstimate', () => {
  it('cycles through the presets and wraps', () => {
    expect(nextEstimate(25)).toBe(30)
    expect(nextEstimate(90)).toBe(25)
  })

  it('recovers from a non-preset value by restarting the cycle', () => {
    expect(ESTIMATE_CYCLE).toContain(nextEstimate(37))
  })
})

describe('task slices', () => {
  const a = mkTask({ id: 'a', createdAt: 1 })
  const b = mkTask({ id: 'b', createdAt: 3 })
  const done = mkTask({ id: 'c', createdAt: 2, doneAt: 100 })
  const doneLater = mkTask({ id: 'd', createdAt: 2, doneAt: 200 })
  const sched = mkTask({ id: 'e', dayKey: '2026-07-18', startMin: 600 })
  const schedEarly = mkTask({ id: 'f', dayKey: '2026-07-18', startMin: 540 })

  it('openTasks: open only, newest first', () => {
    expect(openTasks([a, b, done]).map((t) => t.id)).toEqual(['b', 'a'])
  })

  it('doneTasks: completed only, latest finish first', () => {
    expect(doneTasks([a, done, doneLater]).map((t) => t.id)).toEqual(['d', 'c'])
  })

  it('scheduledTasks: matching day ordered by start', () => {
    expect(scheduledTasks([a, sched, schedEarly], '2026-07-18').map((t) => t.id)).toEqual([
      'f',
      'e',
    ])
    expect(scheduledTasks([sched], '2026-07-19')).toEqual([])
  })

  it('doneCountOn counts completions on the local day', () => {
    const today = toDayKey(Date.now())
    const doneToday = mkTask({ id: 'g', doneAt: Date.now() })
    expect(doneCountOn([doneToday, a], today, toDayKey)).toBe(1)
  })
})
