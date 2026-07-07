import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { ChallengeCard } from './ChallengeCard'

describe('ChallengeCard', () => {
  it('lists the three steps with completion marks', () => {
    renderWithI18n(
      <ChallengeCard
        challenge={{ startDate: '2026-07-06', completed: [true, false, false] }}
        todayKey="2026-07-07"
      />,
    )
    expect(screen.getByText('三天挑战')).toBeInTheDocument()
    expect(screen.getByText(/第 1 天/)).toBeInTheDocument()
    expect(screen.getByText(/第 3 天/)).toBeInTheDocument()
    expect(screen.getAllByText('✓')).toHaveLength(1) // only day 1 is done
  })

  it('renders nothing outside the three-day window', () => {
    const { container } = renderWithI18n(
      <ChallengeCard
        challenge={{ startDate: '2026-07-01', completed: [true, false, false] }}
        todayKey="2026-07-07"
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
