import { db } from './db'
import { DEFAULT_DAY, DEFAULT_SETTINGS, DEFAULT_TYPES, MAX_SESSION_TYPES, presetsFor } from '../domain/defaults'
import { finishActive, isStaleDay, pauseActive, resumeActive } from '../domain/time'
import type { ActiveSession, DayState, Direction, Session, SessionType, Settings } from '../domain/types'
import { newId } from '../lib/id'

export interface AppState {
  sessionTypes: SessionType[]
  sessions: Session[]
  directions: Direction[]
  day: DayState
  active: ActiveSession | null
  settings: Settings
}

async function getKv<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key)
  return row ? (row.value as T) : fallback
}

function setKv(key: string, value: unknown) {
  return db.kv.put({ key, value })
}

/** Stored settings over the defaults, so settings added in a later version get their default. */
async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await getKv<Partial<Settings>>('settings', {})) }
}

/** Everything the UI renders from, read in one snapshot. */
export function loadState(): Promise<AppState> {
  return db.transaction('r', db.sessions, db.kv, async () => ({
    sessionTypes: await getKv('sessionTypes', DEFAULT_TYPES),
    sessions: await db.sessions.orderBy('startTime').toArray(),
    directions: await getKv<Direction[]>('directions', []),
    day: await getKv('day', DEFAULT_DAY),
    active: await getKv<ActiveSession | null>('active', null),
    settings: await getSettings(),
  }))
}

// ── Day ─────────────────────────────────────────────────────────────────────

export function startDay(now: number) {
  return db.transaction('rw', db.kv, async () => {
    const day = await getKv('day', DEFAULT_DAY)
    if (!day.started) await setKv('day', { started: true, startTime: now, endTime: 0 })
  })
}

/** End Today confirmed: freeze the timeline. The day stays open until the reflection is closed. */
export function markDayEnd(now: number) {
  return db.transaction('rw', db.kv, async () => {
    const day = await getKv('day', DEFAULT_DAY)
    if (day.started && !day.endTime) await setKv('day', { ...day, endTime: now })
  })
}

async function archiveDay(day: DayState, endTime: number, reflection: string) {
  await db.days.put({
    startTime: day.startTime,
    endTime,
    reflection,
    directions: await getKv<Direction[]>('directions', []),
  })
  await setKv('day', DEFAULT_DAY)
  await setKv('directions', []) // "Today's Direction" belongs to the day that just closed
}

/** Reflection finished: archive the day and return to a not-started state. */
export function closeDay(reflection: string, now: number) {
  return db.transaction('rw', db.kv, db.days, async () => {
    const day = await getKv('day', DEFAULT_DAY)
    if (day.started) await archiveDay(day, day.endTime || now, reflection.trim())
  })
}

/**
 * A day that was never ended is closed quietly once the 4am rollover has passed, ending at its
 * last recording. Skipped while a session is still running. Returns whether a day was closed.
 */
export function closeStaleDay(now: number): Promise<boolean> {
  return db.transaction('rw', db.kv, db.days, db.sessions, async () => {
    const day = await getKv('day', DEFAULT_DAY)
    const active = await getKv<ActiveSession | null>('active', null)
    if (active || !isStaleDay(day, now)) return false
    const last = await db.sessions.where('startTime').aboveOrEqual(day.startTime).last()
    await archiveDay(day, last ? last.endTime : day.startTime, '')
    return true
  })
}

export function setDirections(directions: Direction[]) {
  return setKv('directions', directions)
}

// ── Recording ───────────────────────────────────────────────────────────────

export interface StartSessionInput {
  typeId: string
  description: string
  focusEnabled: boolean
  reminder: string
}

/** Start recording. Also starts the day if the user skipped Start Today. */
export function startSession(input: StartSessionInput, now: number) {
  return db.transaction('rw', db.kv, async () => {
    if (await getKv<ActiveSession | null>('active', null)) return
    const types = await getKv('sessionTypes', DEFAULT_TYPES)
    const typeName = types.find(type => type.id === input.typeId)?.name ?? input.typeId
    const day = await getKv('day', DEFAULT_DAY)
    if (!day.started) await setKv('day', { started: true, startTime: now, endTime: 0 })
    const active: ActiveSession = {
      typeId: input.typeId,
      typeName,
      description: input.description,
      startTime: now,
      pausedDuration: 0,
      isPaused: false,
      focusEnabled: input.focusEnabled,
      reminder: input.reminder,
    }
    await setKv('active', active)
  })
}

async function updateActive(change: (active: ActiveSession) => ActiveSession) {
  await db.transaction('rw', db.kv, async () => {
    const active = await getKv<ActiveSession | null>('active', null)
    if (active) await setKv('active', change(active))
  })
}

export function pauseSession(now: number) {
  return updateActive(active => pauseActive(active, now))
}

export function resumeSession(now: number) {
  return updateActive(active => resumeActive(active, now))
}

/** Finish the in-progress session and store it. Returns null when nothing was recording. */
export function endSession(now: number): Promise<Session | null> {
  return db.transaction('rw', db.kv, db.sessions, async () => {
    const active = await getKv<ActiveSession | null>('active', null)
    if (!active) return null
    const finished = finishActive(active, now, newId())
    await db.sessions.add(finished)
    await db.kv.delete('active')
    return finished
  })
}

export function updateSessionDescription(id: string, description: string) {
  return db.sessions.update(id, { description })
}

// ── Categories ──────────────────────────────────────────────────────────────

async function updateTypes(change: (types: SessionType[]) => SessionType[]) {
  await db.transaction('rw', db.kv, async () => {
    await setKv('sessionTypes', change(await getKv('sessionTypes', DEFAULT_TYPES)))
  })
}

export type NewSessionType = Omit<SessionType, 'id'>

export function createType(type: NewSessionType) {
  return updateTypes(types => (types.length >= MAX_SESSION_TYPES ? types : [...types, { ...type, id: newId() }]))
}

export function updateType(typeId: string, updates: Partial<NewSessionType>) {
  return updateTypes(types => types.map(type => (type.id === typeId ? { ...type, ...updates } : type)))
}

/** Remove a category and its direction. Past sessions keep the name they were recorded under. */
export function deleteType(typeId: string) {
  return db.transaction('rw', db.kv, async () => {
    const types = await getKv('sessionTypes', DEFAULT_TYPES)
    await setKv('sessionTypes', types.filter(type => type.id !== typeId))
    const directions = await getKv<Direction[]>('directions', [])
    await setKv('directions', directions.filter(direction => direction.typeId !== typeId))
  })
}

export function addPreset(typeId: string, preset: string) {
  return updateTypes(types =>
    types.map(type => {
      if (type.id !== typeId) return type
      const existing = presetsFor(type)
      if (existing.some(item => item.toLowerCase() === preset.toLowerCase())) return type
      return { ...type, presets: [...existing, preset] }
    }),
  )
}

// ── Settings ────────────────────────────────────────────────────────────────

export function updateSettings(updates: Partial<Settings>) {
  return db.transaction('rw', db.kv, async () => {
    await setKv('settings', { ...(await getSettings()), ...updates })
  })
}
