import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db } from '../../data/db'
import { sessionRepository } from '../../data/sessionRepository'
import { PauseButton } from './PauseButton'

beforeEach(async () => {
  await db.sessions.clear()
})

describe('PauseButton', () => {
  it('shows 快速暂停 for an active session and pauses on click', async () => {
    const s = await sessionRepository.start('work', '')
    render(<PauseButton session={s} />)
    await userEvent.click(screen.getByRole('button', { name: '快速暂停' }))
    const cur = await sessionRepository.getById(s.id)
    expect(cur?.status).toBe('paused')
  })

  it('shows 继续 for a paused session and resumes on click', async () => {
    const s = await sessionRepository.start('work', '')
    await sessionRepository.pause(s.id)
    const paused = await sessionRepository.getById(s.id)
    render(<PauseButton session={paused!} />)
    await userEvent.click(screen.getByRole('button', { name: '继续' }))
    const cur = await sessionRepository.getById(s.id)
    expect(cur?.status).toBe('active')
  })
})
