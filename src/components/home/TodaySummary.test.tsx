import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { TodaySummary } from './TodaySummary'
import type { TodayStats } from '../../domain/todayStats'

const stats: TodayStats = {
  hasSession: true,
  sessionCount: 3,
  totalTrackedMs: (1 * 60 + 14) * 60_000, // 1h 14m
  lastCategoryId: 'work',
}

describe('TodaySummary', () => {
  it('shows total tracked time and session count', () => {
    renderWithI18n(<TodaySummary stats={stats} />)
    expect(screen.getByText('今日进展')).toBeInTheDocument()
    expect(screen.getByText('1时14分')).toBeInTheDocument()
    expect(screen.getByText('3 个 session')).toBeInTheDocument()
  })

  it('localizes to English', () => {
    renderWithI18n(<TodaySummary stats={stats} />, { locale: 'en' })
    expect(screen.getByText('Today so far')).toBeInTheDocument()
    expect(screen.getByText('1h 14m')).toBeInTheDocument()
    expect(screen.getByText('3 session(s)')).toBeInTheDocument()
  })
})
