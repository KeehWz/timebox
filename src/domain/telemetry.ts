// Shapes shared by the app and the Worker that receives them (worker/index.ts).
// Events carry counts, flags and durations only — never anything the user typed.

export const EVENT_NAMES = [
  'app_open',
  'day_start',
  'session_start',
  'session_end',
  'direction_set',
  'day_end',
  'reflection_done',
  'category_create',
  'stats_view',
] as const

export type EventName = (typeof EVENT_NAMES)[number]
export type EventProps = Record<string, number | boolean>

export interface TelemetryEvent {
  name: EventName
  ts: number // epoch ms on the device
  props?: EventProps
}

export interface EventsPayload {
  installId: string
  appVersion: string
  events: TelemetryEvent[]
}

export interface FeedbackPayload {
  installId: string
  appVersion: string
  message: string
  contact?: string
}

export const MAX_EVENTS_PER_BATCH = 100
export const MAX_MESSAGE_LENGTH = 4000
export const MAX_CONTACT_LENGTH = 200
const MAX_ID_LENGTH = 64
const MAX_VERSION_LENGTH = 20
const MAX_PROPS = 8

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function shortString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max
}

function parseEvent(input: unknown): TelemetryEvent | null {
  if (!isRecord(input)) return null
  const { name, ts, props } = input
  if (!EVENT_NAMES.includes(name as EventName)) return null
  if (typeof ts !== 'number' || !Number.isFinite(ts)) return null
  if (props === undefined) return { name: name as EventName, ts }
  if (!isRecord(props)) return null
  const entries = Object.entries(props)
  if (entries.length > MAX_PROPS) return null
  for (const [key, value] of entries) {
    if (key.length > 32) return null
    if (typeof value === 'boolean') continue
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
  }
  return { name: name as EventName, ts, props: props as EventProps }
}

/** Validate an untrusted events batch. Any malformed part rejects the whole batch. */
export function parseEventsPayload(input: unknown): EventsPayload | null {
  if (!isRecord(input)) return null
  const { installId, appVersion, events } = input
  if (!shortString(installId, MAX_ID_LENGTH) || !shortString(appVersion, MAX_VERSION_LENGTH)) return null
  if (!Array.isArray(events) || events.length === 0 || events.length > MAX_EVENTS_PER_BATCH) return null
  const parsed: TelemetryEvent[] = []
  for (const item of events) {
    const event = parseEvent(item)
    if (!event) return null
    parsed.push(event)
  }
  return { installId, appVersion, events: parsed }
}

/** Validate an untrusted feedback submission. The message is trimmed; an empty contact is dropped. */
export function parseFeedbackPayload(input: unknown): FeedbackPayload | null {
  if (!isRecord(input)) return null
  const { installId, appVersion, message, contact } = input
  if (!shortString(installId, MAX_ID_LENGTH) || !shortString(appVersion, MAX_VERSION_LENGTH)) return null
  if (typeof message !== 'string') return null
  const text = message.trim()
  if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) return null
  if (contact === undefined || contact === '') return { installId, appVersion, message: text }
  if (typeof contact !== 'string' || contact.length > MAX_CONTACT_LENGTH) return null
  const trimmed = contact.trim()
  return trimmed ? { installId, appVersion, message: text, contact: trimmed } : { installId, appVersion, message: text }
}
