import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { InboxTaskRow } from './InboxTaskRow'
import type { Task } from '../../domain/task'

const task: Task = {
  id: 't1',
  title: 'Review PR feedback',
  estimateMin: 45,
  dayKey: null,
  startMin: null,
  doneAt: null,
  createdAt: 1,
  updatedAt: 1,
}

function setup() {
  const handlers = {
    onPlay: vi.fn(),
    onSchedule: vi.fn(),
    onToggleDone: vi.fn(),
    onCycleEstimate: vi.fn(),
  }
  renderWithI18n(<InboxTaskRow task={task} {...handlers} />)
  return handlers
}

describe('InboxTaskRow', () => {
  it('shows the title and estimate chip', () => {
    setup()
    expect(screen.getByText('Review PR feedback')).toBeInTheDocument()
    expect(screen.getByText('45 分钟')).toBeInTheDocument()
  })

  it('wires the four actions', async () => {
    const handlers = setup()
    await userEvent.click(screen.getByText('45 分钟'))
    expect(handlers.onCycleEstimate).toHaveBeenCalledWith(task)
    await userEvent.click(screen.getByRole('button', { name: /开始专注/ }))
    expect(handlers.onPlay).toHaveBeenCalledWith(task)
    await userEvent.click(screen.getByRole('button', { name: /安排到今天/ }))
    expect(handlers.onSchedule).toHaveBeenCalledWith(task)
    await userEvent.click(screen.getByRole('button', { name: /标记完成/ }))
    expect(handlers.onToggleDone).toHaveBeenCalledWith(task)
  })
})
