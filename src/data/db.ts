import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Session, SessionType } from '../domain/session'
import type { CategoryStats } from '../domain/categoryStats'
import type { Day } from '../domain/day'
import type { DailyDirection } from '../domain/dailyDirection'
import type { Milestone } from '../domain/milestone'

/** prefs rows are key/value; typing lives in domain/prefs.ts + prefsRepository. */
export interface PrefRow {
  key: string
  value: unknown
}

export type TimeboxDB = Dexie & {
  sessions: EntityTable<Session, 'id'>
  categoryStats: EntityTable<CategoryStats, 'id'>
  days: EntityTable<Day, 'date'>
  dailyDirections: Table<DailyDirection, [string, string]> // compound PK [date+categoryId]
  prefs: EntityTable<PrefRow, 'key'>
  milestones: EntityTable<Milestone, 'id'>
}

/**
 * Schema history (additive only — never rename or remove fields in place):
 *   v1  sessions (status / dayKey / startedAt / categoryId indexes)
 *   v2  sessions.type (backfilled 'standard', indexed) + categoryStats table
 *   v3  days, dailyDirections, prefs, milestones tables (no data upgrade needed)
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

  instance.version(3).stores({
    days: 'date',
    dailyDirections: '[date+categoryId], date',
    prefs: 'key',
    milestones: 'id, dayKey',
  })

  return instance as TimeboxDB
}

/** Local-first store (IndexedDB via Dexie). */
export const db = applySchema(new Dexie('timebox'))
