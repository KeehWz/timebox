import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { db } from '../data/db'
import { prefsRepository } from '../data/prefsRepository'
import { sessionRepository } from '../data/sessionRepository'
import { useOnboardingGate } from './useOnboardingGate'

function Probe() {
  useOnboardingGate()
  const location = useLocation()
  return <span data-testid="path">{location.pathname}</span>
}

beforeEach(async () => {
  await Promise.all([db.sessions.clear(), db.prefs.clear(), db.days.clear()])
})

describe('useOnboardingGate', () => {
  it('routes brand-new users to /welcome', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/welcome'))
  })

  it('leaves onboarded users alone', async () => {
    await prefsRepository.set('onboardingCompleted', true)
    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    )
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })

  it('silently marks upgrading users (existing sessions) as onboarded', async () => {
    await sessionRepository.start('work', '')
    render(
      <MemoryRouter initialEntries={['/']}>
        <Probe />
      </MemoryRouter>,
    )
    await waitFor(async () => {
      expect(await prefsRepository.get('onboardingCompleted')).toBe(true)
    })
    expect(screen.getByTestId('path')).toHaveTextContent('/')
  })
})
