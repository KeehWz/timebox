import 'fake-indexeddb/auto' // provides global indexedDB in the test environment — must be first
import { beforeEach, describe, it, expect } from 'vitest'
import { db } from './db'
import { sessionRepository } from './sessionRepository'
import { ActiveSessionExistsError, SessionNotFoundError } from '../lib/errors'

beforeEach(async () => {
  await db.sessions.clear()
})

describe('start', () => {
  it('creates an active session with a trimmed note, id and dayKey', async () => {
    const s = await sessionRepository.start('work', '  backtesting  ')
    expect(s.status).toBe('active')
    expect(s.note).toBe('backtesting')
    expect(s.categoryId).toBe('work')
    expect(s.endedAt).toBeNull()
    expect(s.pauses).toEqual([])
    expect(s.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(s.dayKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it('allows an empty note', async () => {
    const s = await sessionRepository.start('rest', '')
    expect(s.note).toBe('')
  })
  it('rejects a second concurrent session', async () => {
    await sessionRepository.start('work', '')
    await expect(sessionRepository.start('study', '')).rejects.toBeInstanceOf(
      ActiveSessionExistsError,
    )
  })
  it('allows a new session after the previous ends', async () => {
    const first = await sessionRepository.start('work', '')
    await sessionRepository.end(first.id)
    const second = await sessionRepository.start('study', '')
    expect(second.status).toBe('active')
  })
})

describe('getActive', () => {
  it('returns null when there is none', async () => {
    expect(await sessionRepository.getActive()).toBeNull()
  })
  it('returns the active or paused session', async () => {
    const s = await sessionRepository.start('work', '')
    expect((await sessionRepository.getActive())?.id).toBe(s.id)
    await sessionRepository.pause(s.id)
    expect((await sessionRepository.getActive())?.id).toBe(s.id)
  })
})

describe('pause / resume', () => {
  it('opens a pause, then closes it on resume', async () => {
    const s = await sessionRepository.start('work', '')
    await sessionRepository.pause(s.id)
    let cur = await sessionRepository.getById(s.id)
    expect(cur?.status).toBe('paused')
    expect(cur?.pauses).toHaveLength(1)
    expect(cur?.pauses[0]?.resumedAt).toBeNull()

    await sessionRepository.resume(s.id)
    cur = await sessionRepository.getById(s.id)
    expect(cur?.status).toBe('active')
    expect(cur?.pauses[0]?.resumedAt).not.toBeNull()
  })
  it('pause is a no-op when already paused', async () => {
    const s = await sessionRepository.start('work', '')
    await sessionRepository.pause(s.id)
    await sessionRepository.pause(s.id)
    const cur = await sessionRepository.getById(s.id)
    expect(cur?.pauses).toHaveLength(1)
  })
  it('resume is a no-op when active', async () => {
    const s = await sessionRepository.start('work', '')
    await sessionRepository.resume(s.id)
    const cur = await sessionRepository.getById(s.id)
    expect(cur?.status).toBe('active')
    expect(cur?.pauses).toHaveLength(0)
  })
})

describe('end', () => {
  it('completes the session and sets endedAt', async () => {
    const s = await sessionRepository.start('work', '')
    const ended = await sessionRepository.end(s.id)
    expect(ended.status).toBe('completed')
    expect(ended.endedAt).not.toBeNull()
  })
  it('closes an open pause when ending while paused', async () => {
    const s = await sessionRepository.start('work', '')
    await sessionRepository.pause(s.id)
    const ended = await sessionRepository.end(s.id)
    expect(ended.status).toBe('completed')
    expect(ended.pauses[0]?.resumedAt).toBe(ended.endedAt)
  })
  it('throws for a missing id', async () => {
    await expect(sessionRepository.end('does-not-exist')).rejects.toBeInstanceOf(
      SessionNotFoundError,
    )
  })
})

describe('listByDay', () => {
  it('returns the day’s sessions ordered by startedAt', async () => {
    const a = await sessionRepository.start('work', 'a')
    await sessionRepository.end(a.id)
    const b = await sessionRepository.start('study', 'b')
    await sessionRepository.end(b.id)

    const list = await sessionRepository.listByDay(a.dayKey)
    expect(list).toHaveLength(2)
    expect(list[0]!.startedAt).toBeLessThanOrEqual(list[1]!.startedAt)
  })
  it('returns an empty array for a day with no sessions', async () => {
    expect(await sessionRepository.listByDay('1999-01-01')).toEqual([])
  })
})
