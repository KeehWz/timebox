import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from './db'
import { taskRepository } from './taskRepository'
import { TaskNotFoundError } from '../lib/errors'

beforeEach(async () => {
  await db.tasks.clear()
})

describe('taskRepository', () => {
  it('adds a trimmed task with defaults', async () => {
    const task = await taskRepository.add('  Review PR feedback  ')
    expect(task.title).toBe('Review PR feedback')
    expect(task.estimateMin).toBe(30)
    expect(task.doneAt).toBeNull()
    expect(task.dayKey).toBeNull()
    expect(await db.tasks.count()).toBe(1)
  })

  it('rejects empty titles', async () => {
    await expect(taskRepository.add('   ')).rejects.toThrow()
  })

  it('cycles the estimate', async () => {
    const task = await taskRepository.add('Plan sprint')
    const next = await taskRepository.cycleEstimate(task.id)
    expect(next.estimateMin).toBe(45)
  })

  it('marks done and undoes', async () => {
    const task = await taskRepository.add('Email sweep')
    const done = await taskRepository.setDone(task.id, true)
    expect(done.doneAt).not.toBeNull()
    const undone = await taskRepository.setDone(task.id, false)
    expect(undone.doneAt).toBeNull()
  })

  it('schedules, moves, and unschedules', async () => {
    const task = await taskRepository.add('Deep work')
    const scheduled = await taskRepository.schedule(task.id, '2026-07-18', 540)
    expect(scheduled).toMatchObject({ dayKey: '2026-07-18', startMin: 540 })
    const moved = await taskRepository.move(task.id, 600)
    expect(moved.startMin).toBe(600)
    const cleared = await taskRepository.unschedule(task.id)
    expect(cleared).toMatchObject({ dayKey: null, startMin: null })
  })

  it('throws TaskNotFoundError for unknown ids', async () => {
    await expect(taskRepository.setDone('nope', true)).rejects.toBeInstanceOf(TaskNotFoundError)
  })
})
