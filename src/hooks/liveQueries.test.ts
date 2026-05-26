import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { db } from '../data/db'
import { sessionRepository } from '../data/sessionRepository'
import { useActiveSession } from './useActiveSession'
import { useDailySessions } from './useDailySessions'

beforeEach(async () => {
  await db.sessions.clear()
})

describe('useActiveSession', () => {
  it('resolves to null when nothing is in progress', async () => {
    const { result } = renderHook(() => useActiveSession())
    await waitFor(() => expect(result.current).toBeNull())
  })

  it('reflects a newly started session', async () => {
    const { result } = renderHook(() => useActiveSession())
    await waitFor(() => expect(result.current).toBeNull())

    let id = ''
    await act(async () => {
      id = (await sessionRepository.start('work', 'x')).id
    })
    await waitFor(() => expect(result.current?.id).toBe(id))
  })
})

describe('useDailySessions', () => {
  it('reflects completed sessions for the given day', async () => {
    const s = await sessionRepository.start('work', 'x')
    await sessionRepository.end(s.id)

    const { result } = renderHook(() => useDailySessions(s.dayKey))
    await waitFor(() => expect(result.current?.length).toBe(1))
  })
})
