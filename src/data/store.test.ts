import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, migrateV1Session } from './db'
import {
  addPreset,
  closeDay,
  closeStaleDay,
  createType,
  deleteType,
  endSession,
  loadState,
  markDayEnd,
  pauseSession,
  resumeSession,
  setDirections,
  startDay,
  startSession,
  updateSessionDescription,
  updateSettings,
  updateType,
} from './store'
import { DEFAULT_TYPES, MAX_SESSION_TYPES } from '../domain/defaults'

const MIN = 60_000
const at = (h: number, m = 0, day = 10) => new Date(2026, 10, day, h, m).getTime()
const work = { typeId: 'work', description: 'Report', focusEnabled: false, reminder: '' }

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('first run', () => {
  it('starts with the default categories and nothing recorded', async () => {
    const state = await loadState()
    expect(state.sessionTypes).toEqual(DEFAULT_TYPES)
    expect(state.sessions).toEqual([])
    expect(state.directions).toEqual([])
    expect(state.day.started).toBe(false)
    expect(state.active).toBeNull()
    expect(state.settings.nudgeAfter).toBe('90')
  })
})

describe('recording', () => {
  it('records a session with a pause and keeps it after ending', async () => {
    await startDay(at(8, 30))
    await startSession(work, at(9))
    await pauseSession(at(9, 20))
    await resumeSession(at(9, 30))
    const finished = await endSession(at(10))

    expect(finished).toMatchObject({ typeId: 'work', typeName: 'Work', description: 'Report', pausedDuration: 10 * MIN })
    const state = await loadState()
    expect(state.active).toBeNull()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0].endTime - state.sessions[0].startTime).toBe(60 * MIN)
  })

  it('starts the day automatically when recording begins before Start Today', async () => {
    await startSession(work, at(9))
    const { day, active } = await loadState()
    expect(day).toEqual({ started: true, startTime: at(9), endTime: 0 })
    expect(active?.typeName).toBe('Work')
  })

  it('does not replace a session that is already running', async () => {
    await startSession(work, at(9))
    await startSession({ ...work, typeId: 'exercise' }, at(9, 5))
    expect((await loadState()).active?.typeId).toBe('work')
  })

  it('returns null when ending with nothing recording', async () => {
    expect(await endSession(at(10))).toBeNull()
  })

  it('edits only the description of one recording', async () => {
    await startSession(work, at(9))
    const finished = await endSession(at(10))
    await updateSessionDescription(finished!.id, 'Quarterly report')
    const state = await loadState()
    expect(state.sessions[0].description).toBe('Quarterly report')
    expect(state.sessionTypes[0].name).toBe('Work')
  })
})

describe('day lifecycle', () => {
  it('does not restart a day that is already started', async () => {
    await startDay(at(8))
    await startDay(at(11))
    expect((await loadState()).day.startTime).toBe(at(8))
  })

  it('freezes the day at End Today, then archives it with the reflection', async () => {
    await startDay(at(8))
    await setDirections([{ typeId: 'work', roughAmount: '3h' }])
    await markDayEnd(at(22))
    expect((await loadState()).day.endTime).toBe(at(22))

    await closeDay('  Felt steady.  ', at(22, 5))
    const state = await loadState()
    expect(state.day.started).toBe(false)
    expect(state.directions).toEqual([])
    expect(await db.days.toArray()).toEqual([
      { startTime: at(8), endTime: at(22), reflection: 'Felt steady.', directions: [{ typeId: 'work', roughAmount: '3h' }] },
    ])
  })

  it('closes a forgotten day at its last recording once 4am has passed', async () => {
    await startDay(at(8))
    await startSession(work, at(9))
    await endSession(at(10))

    expect(await closeStaleDay(at(23))).toBe(false)
    expect(await closeStaleDay(at(7, 0, 11))).toBe(true)
    expect((await loadState()).day.started).toBe(false)
    expect((await db.days.toArray())[0]).toMatchObject({ startTime: at(8), endTime: at(10), reflection: '' })
  })

  it('leaves a forgotten day open while a session is still running', async () => {
    await startDay(at(8))
    await startSession(work, at(23))
    expect(await closeStaleDay(at(7, 0, 11))).toBe(false)
    expect((await loadState()).day.started).toBe(true)
  })
})

describe('categories', () => {
  it('creates, edits and deletes a category along with its direction', async () => {
    await createType({ name: 'Reading', description: 'Custom category', iconId: 'study', presets: ['Novel'] })
    let state = await loadState()
    const reading = state.sessionTypes.at(-1)!
    expect(reading).toMatchObject({ name: 'Reading', iconId: 'study' })

    await updateType(reading.id, { name: 'Books' })
    await setDirections([{ typeId: reading.id, roughAmount: '1h' }, { typeId: 'work', roughAmount: '2h' }])
    await deleteType(reading.id)

    state = await loadState()
    expect(state.sessionTypes.map(type => type.id)).toEqual(DEFAULT_TYPES.map(type => type.id))
    expect(state.directions).toEqual([{ typeId: 'work', roughAmount: '2h' }])
  })

  it('caps the number of categories', async () => {
    for (let i = 0; i < MAX_SESSION_TYPES; i++) await createType({ name: `Type ${i}`, description: '' })
    expect((await loadState()).sessionTypes).toHaveLength(MAX_SESSION_TYPES)
  })

  it('adds a preset once, ignoring case, on top of the built-in presets', async () => {
    await addPreset('exercise', 'Yoga')
    await addPreset('exercise', 'yoga')
    await addPreset('exercise', 'gym')
    const exercise = (await loadState()).sessionTypes.find(type => type.id === 'exercise')!
    expect(exercise.presets).toEqual(['Gym', 'Running', 'Walking', 'Sports', 'Training', 'Yoga'])
  })
})

describe('settings', () => {
  it('merges setting updates', async () => {
    await updateSettings({ nudgeAfter: 'custom', customNudgeMinutes: 45 })
    await updateSettings({ nudgeAfter: 'off' })
    expect((await loadState()).settings).toEqual({ nudgeAfter: 'off', customNudgeMinutes: 45, shareUsage: true })
  })
})

describe('V1 → V2 migration', () => {
  it('converts a finished V1 session', () => {
    expect(
      migrateV1Session({
        id: 'a',
        categoryId: 'chores',
        note: 'Laundry',
        startedAt: at(9),
        endedAt: at(10),
        pauses: [
          { pausedAt: at(9, 10), resumedAt: at(9, 20) },
          { pausedAt: at(9, 50), resumedAt: null },
        ],
      }),
    ).toEqual({
      id: 'a',
      typeId: 'everyday',
      typeName: 'Everyday',
      description: 'Laundry',
      startTime: at(9),
      endTime: at(10),
      pausedDuration: 20 * MIN,
    })
  })

  it('drops unfinished V1 sessions and maps unknown categories to Other', () => {
    const base = { id: 'b', note: '', startedAt: at(9), pauses: [] }
    expect(migrateV1Session({ ...base, categoryId: 'work', endedAt: null })).toBeNull()
    expect(migrateV1Session({ ...base, categoryId: 'mystery', endedAt: at(10) })?.typeId).toBe('other')
  })

  it('upgrades an existing V1 database in place', async () => {
    db.close()
    await Dexie.delete('timebox')
    const v1 = new Dexie('timebox')
    v1.version(1).stores({ sessions: 'id, status, dayKey, startedAt, categoryId' })
    await v1.table('sessions').bulkAdd([
      { id: 'done', categoryId: 'study', note: 'Paper', startedAt: at(9), endedAt: at(10), pauses: [], status: 'completed', dayKey: '2026-11-10', createdAt: at(9), updatedAt: at(10) },
      { id: 'open', categoryId: 'work', note: '', startedAt: at(11), endedAt: null, pauses: [], status: 'active', dayKey: '2026-11-10', createdAt: at(11), updatedAt: at(11) },
    ])
    v1.close()

    await db.open()
    expect((await loadState()).sessions).toEqual([
      { id: 'done', typeId: 'study', typeName: 'Study', description: 'Paper', startTime: at(9), endTime: at(10), pausedDuration: 0 },
    ])
  })
})
