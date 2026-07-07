import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { DayNarrative } from './DayNarrative'
import type { CategoryId, Session } from '../../domain/session'

const HOUR = 3_600_000

function completed(id: string, categoryId: CategoryId, spanMs: number, startedAt = 0): Session {
  return {
    id,
    type: 'standard',
    categoryId,
    note: '',
    startedAt,
    endedAt: startedAt + spanMs,
    pauses: [],
    status: 'completed',
    dayKey: '2026-07-06',
    createdAt: 0,
    updatedAt: 0,
  }
}

const checkIn = {
  id: 'c',
  label: 'Lunch',
  startedAt: 0,
  endedAt: 60_000,
  status: 'done' as const,
  dayKey: '2026-07-06',
  createdAt: 0,
  updatedAt: 0,
}

describe('DayNarrative', () => {
  it('tells the day as one sentence (zh)', () => {
    const sessions = [
      completed('a', 'work', 2 * HOUR),
      completed('b', 'study', HOUR, 3 * HOUR),
      completed('c', 'rest', HOUR / 2, 5 * HOUR),
    ]
    renderWithI18n(<DayNarrative sessions={sessions} checkIns={[checkIn]} now={9 * HOUR} />)
    expect(
      screen.getByText(
        '今天记录了 3 个 session，共专注 3时30分，主要花在工作（2时0分）、学习（1时0分）；另有 1 次打卡。',
      ),
    ).toBeInTheDocument()
  })

  it('localizes to English and omits absent parts', () => {
    renderWithI18n(<DayNarrative sessions={[completed('a', 'work', HOUR)]} now={9 * HOUR} />, {
      locale: 'en',
    })
    expect(
      screen.getByText('You recorded 1 sessions today, 1h 0m of focus — mostly Work (1h 0m).'),
    ).toBeInTheDocument()
  })

  it('renders nothing without completed sessions', () => {
    const { container } = renderWithI18n(<DayNarrative sessions={[]} now={0} />)
    expect(container).toBeEmptyDOMElement()
  })
})
