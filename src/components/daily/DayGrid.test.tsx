import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { db } from '../../data/db'
import { taskRepository } from '../../data/taskRepository'
import { DayGrid } from './DayGrid'
import type { Session } from '../../domain/session'

const DAY = '2026-07-18'

function mkSession(overrides: Partial<Session>): Session {
  const startedAt = new Date(2026, 6, 18, 9, 0).getTime()
  return {
    id: 's1',
    type: 'standard',
    categoryId: 'work',
    note: 'Deep work — proposal draft',
    startedAt,
    endedAt: startedAt + 90 * 60_000,
    pauses: [],
    status: 'completed',
    dayKey: DAY,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides,
  }
}

beforeEach(async () => {
  await db.tasks.clear()
})

describe('DayGrid', () => {
  it('renders hour rules and a session block with its note and duration', () => {
    renderWithI18n(
      <DayGrid
        sessions={[mkSession({})]}
        checkIns={[]}
        tasks={[]}
        dayKey={DAY}
        isToday={false}
        now={new Date(2026, 6, 18, 12).getTime()}
        armedTask={null}
        onDisarm={() => {}}
        onStartFocus={() => {}}
      />,
    )
    expect(screen.getByText('7:00')).toBeInTheDocument()
    expect(screen.getByText('21:00')).toBeInTheDocument()
    expect(screen.getByText('Deep work — proposal draft')).toBeInTheDocument()
    expect(screen.getByText(/9:00 · /)).toBeInTheDocument()
  })

  it('renders drift/ongoing sessions, check-ins, and done tasks', async () => {
    const startedAt = new Date(2026, 6, 18, 13, 30).getTime()
    const drift = mkSession({ id: 'd1', type: 'drift', note: '' })
    const ongoing = mkSession({
      id: 'o1',
      note: 'Email sweep',
      startedAt,
      endedAt: null,
      status: 'active',
    })
    const task = await taskRepository.add('Call with Dana')
    const scheduled = await taskRepository.schedule(task.id, DAY, 16 * 60)
    const done = await taskRepository.setDone(task.id, true)
    void scheduled
    renderWithI18n(
      <DayGrid
        sessions={[drift, ongoing]}
        checkIns={[
          {
            id: 'c1',
            label: '午饭',
            startedAt,
            endedAt: startedAt + 30 * 60_000,
            status: 'done',
            dayKey: DAY,
            createdAt: startedAt,
            updatedAt: startedAt,
          },
        ]}
        tasks={[done]}
        dayKey={DAY}
        isToday
        now={new Date(2026, 6, 18, 14).getTime()}
        armedTask={null}
        onDisarm={() => {}}
        onStartFocus={() => {}}
      />,
    )
    expect(screen.getByText('漂移')).toBeInTheDocument()
    expect(screen.getByText('Email sweep')).toBeInTheDocument()
    expect(screen.getByText(/午饭/)).toBeInTheDocument()
    expect(screen.getByText('Call with Dana')).toBeInTheDocument()
  })

  it('unschedules a selected task from the action bar', async () => {
    const task = await taskRepository.add('Plan sprint')
    const scheduled = await taskRepository.schedule(task.id, DAY, 10 * 60)
    renderWithI18n(
      <DayGrid
        sessions={[]}
        checkIns={[]}
        tasks={[scheduled]}
        dayKey={DAY}
        isToday={false}
        now={new Date(2026, 6, 18, 12).getTime()}
        armedTask={null}
        onDisarm={() => {}}
        onStartFocus={() => {}}
      />,
    )
    fireEvent.pointerDown(screen.getByText('Plan sprint'), { clientY: 60 })
    fireEvent.pointerUp(window)
    fireEvent.click(await screen.findByRole('button', { name: '移出' }))
    await waitFor(async () => {
      const updated = await taskRepository.get(task.id)
      expect(updated?.startMin).toBeNull()
    })
  })

  it('renders scheduled task blocks and opens the action bar on tap', async () => {
    const onStartFocus = vi.fn()
    const task = await taskRepository.add('Email sweep')
    const scheduled = await taskRepository.schedule(task.id, DAY, 13 * 60 + 30)
    renderWithI18n(
      <DayGrid
        sessions={[]}
        checkIns={[]}
        tasks={[scheduled]}
        dayKey={DAY}
        isToday={false}
        now={new Date(2026, 6, 18, 12).getTime()}
        armedTask={null}
        onDisarm={() => {}}
        onStartFocus={onStartFocus}
      />,
    )
    const block = screen.getByText('Email sweep')
    fireEvent.pointerDown(block, { clientY: 100 })
    fireEvent.pointerUp(window)
    await screen.findByRole('button', { name: '专注' })
    fireEvent.click(screen.getByRole('button', { name: '专注' }))
    expect(onStartFocus).toHaveBeenCalled()
  })

  it('places the armed task on grid tap and disarms', async () => {
    const onDisarm = vi.fn()
    const task = await taskRepository.add('Plan next sprint')
    renderWithI18n(
      <DayGrid
        sessions={[]}
        checkIns={[]}
        tasks={[]}
        dayKey={DAY}
        isToday
        now={Date.now()}
        armedTask={task}
        onDisarm={onDisarm}
        onStartFocus={() => {}}
      />,
    )
    expect(screen.getByText(/Plan next sprint/)).toBeInTheDocument()
    const cancel = screen.getByRole('button', { name: '取消' })
    expect(cancel).toBeInTheDocument()
    // jsdom geometry is zero-sized, so a tap lands at the top of the window (7:00)
    fireEvent.click(cancel.closest('section')!.querySelector('[class*="grid"]')!)
    await waitFor(async () => {
      const updated = await taskRepository.get(task.id)
      expect(updated?.startMin).not.toBeNull()
    })
    expect(onDisarm).toHaveBeenCalled()
  })
})
