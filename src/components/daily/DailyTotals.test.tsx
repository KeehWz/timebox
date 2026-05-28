import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyTotals } from './DailyTotals'
import type { CategoryId, Session } from '../../domain/session'

function completed(id: string, categoryId: CategoryId, spanMs: number): Session {
  return {
    id,
    categoryId,
    note: '',
    startedAt: 0,
    endedAt: spanMs,
    pauses: [],
    status: 'completed',
    dayKey: '2026-05-26',
    createdAt: 0,
    updatedAt: 0,
  }
}

describe('DailyTotals', () => {
  it('aggregates focus per category and shows totals', () => {
    const sessions = [
      completed('a', 'work', 3_600_000), // 1h
      completed('b', 'work', 1_800_000), // 30m
      completed('c', 'study', 2_400_000), // 40m
    ]
    render(<DailyTotals sessions={sessions} now={9_999_999} />)
    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('1h 30m')).toBeInTheDocument()
    expect(screen.getByText('40m')).toBeInTheDocument()
    expect(screen.getByText(/总跨度/)).toBeInTheDocument()
  })

  it('renders nothing without completed sessions', () => {
    const { container } = render(<DailyTotals sessions={[]} now={0} />)
    expect(container).toBeEmptyDOMElement()
  })
})
