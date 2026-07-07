import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, it, expect } from 'vitest'
import { applySchema } from './db'

describe('schema migrations', () => {
  it('backfills type=standard on v1 sessions during the v2 upgrade', async () => {
    const name = `timebox-migration-${crypto.randomUUID()}`

    // Write a record with the v1 schema (no `type` field, no categoryStats table)…
    const v1 = new Dexie(name)
    v1.version(1).stores({ sessions: 'id, status, dayKey, startedAt, categoryId' })
    await v1.table('sessions').add({
      id: 's1',
      categoryId: 'work',
      note: '',
      startedAt: 1,
      endedAt: 2,
      pauses: [],
      status: 'completed',
      dayKey: '2026-07-06',
      createdAt: 1,
      updatedAt: 2,
    })
    v1.close()

    // …then reopen with the real schema and let the upgrade run.
    const upgraded = applySchema(new Dexie(name))
    const migrated = await upgraded.sessions.get('s1')
    expect(migrated?.type).toBe('standard')
    expect(await upgraded.categoryStats.toArray()).toEqual([])
    upgraded.close()
    await Dexie.delete(name)
  })
})
