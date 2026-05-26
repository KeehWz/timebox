import Dexie, { type EntityTable } from 'dexie'
import type { Session } from '../domain/session'

/**
 * Local-first store (IndexedDB via Dexie).
 *
 * The primary key is a string UUID (not auto-increment), so the schema is ready for optional
 * cloud sync later (dexie-cloud-addon expects global ids). Indexes:
 *   - status     → find the single active/paused session
 *   - dayKey     → the daily record page
 *   - startedAt  → ordering within a day
 *   - categoryId → potential future per-category queries
 */
export const db = new Dexie('timebox') as Dexie & {
  sessions: EntityTable<Session, 'id'>
}

db.version(1).stores({
  sessions: 'id, status, dayKey, startedAt, categoryId',
})
