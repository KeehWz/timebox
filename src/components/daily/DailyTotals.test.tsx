import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
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
    type: 'standard',
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
    renderWithI18n(<DailyTotals sessions={sessions} now={9_999_999} />)
    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('1时30分')).toBeInTheDocument()
    expect(screen.getByText('40分')).toBeInTheDocument()
    expect(screen.getByText(/总跨度/)).toBeInTheDocument()
  })

  it('renders nothing without completed sessions', () => {
    const { container } = renderWithI18n(<DailyTotals sessions={[]} now={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows intended-vs-actual rows and day counts', () => {
    const sessions = [completed('a', 'work', 3_600_000)]
    const checkIns = [
      {
        id: 'c',
        label: 'Lunch',
        startedAt: 0,
        endedAt: 60_000,
        status: 'done' as const,
        dayKey: '2026-05-26',
        createdAt: 0,
        updatedAt: 0,
      },
    ]
    const directions = [
      { date: '2026-05-26', categoryId: 'work' as const, targetDurationMs: 7_200_000 },
    ]
    renderWithI18n(
      <DailyTotals sessions={sessions} checkIns={checkIns} directions={directions} now={9_999_999} />,
    )
    expect(screen.getByText('方向对比')).toBeInTheDocument()
    expect(screen.getByText('1时0分 / 目标 2时0分')).toBeInTheDocument()
    expect(screen.getByText('1 个 session · 1 次打卡')).toBeInTheDocument()
  })
})
