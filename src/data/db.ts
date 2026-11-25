import Dexie, { type EntityTable } from 'dexie'
import type { DayRecord, Session } from '../domain/types'

export interface KvRow {
  key: string
  value: unknown
}

/**
 * Local-first store (IndexedDB via Dexie).
 *   - sessions: finished recordings (grows over time; indexed by startTime)
 *   - kv:       small singletons — sessionTypes, directions, day, active, settings
 *   - days:     closed days (boundaries, reflection, that day's directions)
 */
export const db = new Dexie('timebox') as Dexie & {
  sessions: EntityTable<Session, 'id'>
  kv: EntityTable<KvRow, 'key'>
  days: EntityTable<DayRecord, 'startTime'>
}

/** Shape of a V1 row, only what the migration reads. */
interface V1Session {
  id: string
  categoryId: string
  note: string
  startedAt: number
  endedAt: number | null
  pauses: { pausedAt: number; resumedAt: number | null }[]
}

const V1_CATEGORY: Record<string, { typeId: string; typeName: string }> = {
  work: { typeId: 'work', typeName: 'Work' },
  study: { typeId: 'study', typeName: 'Study' },
  rest: { typeId: 'rest', typeName: 'Rest' },
  exercise: { typeId: 'exercise', typeName: 'Exercise' },
  chores: { typeId: 'everyday', typeName: 'Everyday' },
  other: { typeId: 'other', typeName: 'Other' },
}

/** Convert a V1 session to the V2 shape. Unfinished V1 sessions cannot be resumed and are dropped. */
export function migrateV1Session(old: V1Session): Session | null {
  if (old.endedAt == null) return null
  const endTime = old.endedAt
  const pausedDuration = (old.pauses ?? []).reduce(
    (total, pause) => total + Math.max(0, (pause.resumedAt ?? endTime) - pause.pausedAt),
    0,
  )
  const category = V1_CATEGORY[old.categoryId] ?? V1_CATEGORY.other
  return {
    id: old.id,
    typeId: category.typeId,
    typeName: category.typeName,
    description: old.note ?? '',
    startTime: old.startedAt,
    endTime,
    pausedDuration,
  }
}

db.version(1).stores({
  sessions: 'id, status, dayKey, startedAt, categoryId',
})

db.version(2)
  .stores({
    sessions: 'id, startTime',
    kv: 'key',
    days: 'startTime',
  })
  .upgrade(tx =>
    tx
      .table('sessions')
      .toCollection()
      .modify((row, ref) => {
        const next = migrateV1Session(row as V1Session)
        if (next) ref.value = next
        else delete (ref as { value?: unknown }).value
      }),
  )
