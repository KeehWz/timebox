import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { db } from '../../data/db'
import { prefsRepository } from '../../data/prefsRepository'
import { sessionRepository } from '../../data/sessionRepository'
import type { Session } from '../../domain/session'
import { DriftPrompt, DEFAULT_DRIFT_PROMPT_MINUTES } from './DriftPrompt'

const MINUTE = 60_000
const INTERVAL = DEFAULT_DRIFT_PROMPT_MINUTES * MINUTE

function driftSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 'd',
    type: 'drift',
    categoryId: 'other',
    note: '',
    startedAt: 0,
    endedAt: null,
    pauses: [],
    status: 'active',
    dayKey: '2026-07-06',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

beforeEach(async () => {
  await Promise.all([db.sessions.clear(), db.prefs.clear(), db.days.clear()])
})

describe('DriftPrompt', () => {
  it('never renders for standard sessions', async () => {
    const { container } = renderWithI18n(
      <DriftPrompt session={driftSession({ type: 'standard' })} now={INTERVAL * 5} onEnd={() => {}} />,
    )
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(container).toBeEmptyDOMElement()
  })

  it('stays hidden before the interval, appears after', async () => {
    const session = driftSession()
    const { rerender } = renderWithI18n(
      <DriftPrompt session={session} now={INTERVAL - MINUTE} onEnd={() => {}} />,
    )
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(screen.queryByText('还在漂移吗？')).not.toBeInTheDocument()

    rerender(<DriftPrompt session={session} now={INTERVAL + 1} onEnd={() => {}} />)
    await waitFor(() => expect(screen.getByText('还在漂移吗？')).toBeInTheDocument())
  })

  it('"keep drifting" snoozes for one more interval', async () => {
    const session = driftSession()
    const { rerender } = renderWithI18n(
      <DriftPrompt session={session} now={INTERVAL + 1} onEnd={() => {}} />,
    )
    await waitFor(() => expect(screen.getByText('还在漂移吗？')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: '继续漂移' }))
    expect(screen.queryByText('还在漂移吗？')).not.toBeInTheDocument()

    rerender(<DriftPrompt session={session} now={INTERVAL * 2 + 2} onEnd={() => {}} />)
    await waitFor(() => expect(screen.getByText('还在漂移吗？')).toBeInTheDocument())
  })

  it('converting files the session under a category', async () => {
    const real = await sessionRepository.start('other', '', 'drift')
    renderWithI18n(
      <DriftPrompt
        session={{ ...real, startedAt: Date.now() - INTERVAL - MINUTE }}
        now={Date.now()}
        onEnd={() => {}}
      />,
    )
    await waitFor(() => expect(screen.getByText('还在漂移吗？')).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: '归类为工作' }))
    await waitFor(async () => {
      const updated = await sessionRepository.getById(real.id)
      expect(updated?.type).toBe('standard')
      expect(updated?.categoryId).toBe('work')
    })
  })

  it('end button delegates and the off pref disables the prompt', async () => {
    const onEnd = vi.fn()
    const session = driftSession()
    renderWithI18n(<DriftPrompt session={session} now={INTERVAL + 1} onEnd={onEnd} />)
    await waitFor(() => expect(screen.getByText('还在漂移吗？')).toBeInTheDocument())
    await userEvent.click(screen.getByRole('button', { name: '结束这段时间' }))
    expect(onEnd).toHaveBeenCalledTimes(1)

    await prefsRepository.set('driftPrompt', { intervalMinutes: null })
    renderWithI18n(<DriftPrompt session={session} now={INTERVAL * 10} onEnd={() => {}} />)
    await waitFor(async () => {
      expect(await prefsRepository.get('driftPrompt')).toEqual({ intervalMinutes: null })
    })
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(screen.queryByText('还在漂移吗？')).not.toBeInTheDocument()
  })
})
