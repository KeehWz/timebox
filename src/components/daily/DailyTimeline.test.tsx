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
      createdAt: 0,
      updatedAt: 0,
    }
    renderWithI18n(<DailyTimeline sessions={[session]} now={Date.now()} />)
    expect(screen.getByText('DP review')).toBeInTheDocument()
    expect(screen.getByText('09:10')).toBeInTheDocument()
    expect(screen.getByText('10:25')).toBeInTheDocument()
    expect(screen.getByText('学习')).toBeInTheDocument()
  })
})
