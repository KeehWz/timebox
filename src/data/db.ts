import Dexie, { type EntityTable } from 'dexie'
import type { Session, SessionType } from '../domain/session'
import type { CategoryStats } from '../domain/categoryStats'

export type TimeboxDB = Dexie & {
  sessions: EntityTable<Session, 'id'>
  categoryStats: EntityTable<CategoryStats, 'id'>
}

/**
 * Schema history (additive only — never rename or remove fields in place):
 *   v1  sessions (status / dayKey / startedAt / categoryId indexes)
 *   v2  sessions.type (backfilled 'standard', indexed) + categoryStats table
 *
 * Exported so tests can replay the upgrade path on a scratch database.
 * The primary key is a string UUID (not auto-increment), so the schema is ready for optional
 * cloud sync later (dexie-cloud-addon expects global ids).
 */
export function applySchema(instance: Dexie): TimeboxDB {
  instance.version(1).stores({
    sessions: 'id, status, dayKey, startedAt, categoryId',
  })

  instance
    .version(2)
    .stores({
      sessions: 'id, status, dayKey, startedAt, categoryId, type',
      categoryStats: 'id',
    })
    .upgrade((tx) =>
      tx
        .table('sessions')
        .toCollection()
        .modify((session: { type?: SessionType }) => {
          session.type ??= 'standard'
        }),
    )

  return instance as TimeboxDB
}

/** Local-first store (IndexedDB via Dexie). */
export const db = applySchema(new Dexie('timebox'))
