import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerDisplay } from './TimerDisplay'
import type { Session } from '../../domain/session'

const session: Session = {
  id: 't',
  categoryId: 'work',
  note: '',
  startedAt: 0,
  endedAt: null,
  pauses: [],
  status: 'active',
  dayKey: '1970-01-01',
  createdAt: 0,
  updatedAt: 0,
}

describe('TimerDisplay', () => {
  it('renders active elapsed time as HH:MM:SS', () => {
    render(<TimerDisplay session={session} now={3_661_000} />)
    expect(screen.getByText('01:01:01')).toBeInTheDocument()
  })

  it('freezes at the pre-pause value during an open pause', () => {
    const paused: Session = {
      ...session,
      status: 'paused',
      pauses: [{ pausedAt: 30_000, resumedAt: null }],
    }
    render(<TimerDisplay session={paused} now={120_000} />)
    expect(screen.getByText('00:00:30')).toBeInTheDocument()
  })
})
