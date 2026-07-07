import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { DailyTimeline } from './DailyTimeline'
import type { Session } from '../../domain/session'

describe('DailyTimeline', () => {
  it('shows an empty state with no sessions', () => {
    renderWithI18n(<DailyTimeline sessions={[]} now={0} />)
    expect(screen.getByText('今天还没有记录')).toBeInTheDocument()
  })

  it('renders a row per session with time range, note and category', () => {
    const session: Session = {
      id: 'a',
      categoryId: 'study',
      note: 'DP review',
      startedAt: new Date(2026, 4, 26, 9, 10).getTime(),
      endedAt: new Date(2026, 4, 26, 10, 25).getTime(),
      pauses: [],
      status: 'completed',
      dayKey: '2026-05-26',
      type: 'standard',
      createdAt: 0,
      updatedAt: 0,
    }
    renderWithI18n(<DailyTimeline sessions={[session]} now={Date.now()} />)
    expect(screen.getByText('DP review')).toBeInTheDocument()
    expect(screen.getByText('09:10')).toBeInTheDocument()
    expect(screen.getByText('10:25')).toBeInTheDocument()
    expect(screen.getByText('学习')).toBeInTheDocument()
  })

  it('interleaves check-ins and drift sessions by start time', () => {
    const drift: Session = {
      id: 'd',
      categoryId: 'other',
      note: '',
      startedAt: new Date(2026, 4, 26, 11, 0).getTime(),
      endedAt: new Date(2026, 4, 26, 11, 20).getTime(),
      pauses: [],
      status: 'completed',
      dayKey: '2026-05-26',
      type: 'drift',
      createdAt: 0,
      updatedAt: 0,
    }
    const checkIn = {
      id: 'c',
      label: 'Lunch',
      startedAt: new Date(2026, 4, 26, 12, 0).getTime(),
      endedAt: new Date(2026, 4, 26, 12, 30).getTime(),
      status: 'done' as const,
      dayKey: '2026-05-26',
      createdAt: 0,
      updatedAt: 0,
    }
    renderWithI18n(<DailyTimeline sessions={[drift]} checkIns={[checkIn]} now={Date.now()} />)

    expect(screen.getByText('漂移')).toBeInTheDocument()
    expect(screen.getByText(/Lunch/)).toBeInTheDocument()
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('漂移') // 11:00 before the 12:00 check-in
    expect(items[1]).toHaveTextContent('Lunch')
  })
})
