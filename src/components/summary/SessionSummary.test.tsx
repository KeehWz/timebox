import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { SessionSummary } from './SessionSummary'
import type { Session } from '../../domain/session'

const session: Session = {
  id: 's',
  categoryId: 'work',
  note: 'execution model',
  startedAt: new Date(2026, 4, 26, 14, 5).getTime(),
  endedAt: new Date(2026, 4, 26, 15, 28).getTime(),
  pauses: [
    {
      pausedAt: new Date(2026, 4, 26, 14, 30).getTime(),
      resumedAt: new Date(2026, 4, 26, 14, 39).getTime(),
    },
  ],
  status: 'completed',
  dayKey: '2026-05-26',
  createdAt: 0,
  updatedAt: 0,
}

describe('SessionSummary', () => {
  it('renders category, note, times and derived metrics', () => {
    renderWithI18n(<SessionSummary session={session} />)
    expect(screen.getByText('工作')).toBeInTheDocument()
    expect(screen.getByText('execution model')).toBeInTheDocument()
    expect(screen.getByText('14:05')).toBeInTheDocument()
    expect(screen.getByText('15:28')).toBeInTheDocument()
    expect(screen.getByText('1时14分')).toBeInTheDocument() // focus = span(1时23分) − paused(9分)
    expect(screen.getByText('1时23分')).toBeInTheDocument() // span
    expect(screen.getByText(/1 次/)).toBeInTheDocument() // one quick-pause (zh)
  })
})
