import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithI18n } from '../test/renderWithI18n'
import { db } from '../data/db'
import { prefsRepository } from '../data/prefsRepository'
import { toDayKey } from '../domain/time'
import { useFirstSessionReminder } from './useFirstSessionReminder'

function Probe() {
  useFirstSessionReminder()
  return null
}

beforeEach(async () => {
  await Promise.all([db.sessions.clear(), db.prefs.clear(), db.days.clear()])
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFirstSessionReminder', () => {
  it('does nothing without a configured reminder or Notification support', async () => {
    renderWithI18n(<Probe />)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(await prefsRepository.get('reminderLastFiredOn')).toBeUndefined()

    // configured, but jsdom has no Notification API → still a no-op
    await prefsRepository.set('reminder', { firstSessionTime: '00:00' })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(await prefsRepository.get('reminderLastFiredOn')).toBeUndefined()
  })

  it('fires once when past the reminder time with nothing tracked', async () => {
    const created: string[] = []
    vi.stubGlobal(
      'Notification',
      class {
        static permission = 'granted'
        constructor(title: string) {
          created.push(title)
        }
      },
    )
    await prefsRepository.set('reminder', { firstSessionTime: '00:00' })

    renderWithI18n(<Probe />)
    await waitFor(async () => {
      expect(await prefsRepository.get('reminderLastFiredOn')).toBe(toDayKey(Date.now()))
    })
    expect(created).toHaveLength(1)
  })
})
