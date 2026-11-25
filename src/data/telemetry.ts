import { db } from './db'
import { DEFAULT_SETTINGS } from '../domain/defaults'
import { MAX_EVENTS_PER_BATCH, type EventName, type EventProps, type TelemetryEvent } from '../domain/telemetry'
import type { Settings } from '../domain/types'
import { newId } from '../lib/id'

// Usage events wait in a local outbox and are sent when the network allows, so an offline day
// still counts. Nothing here may throw into the app: recording is best-effort by design.

const OUTBOX_LIMIT = 500

async function getKv<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key)
  return row ? (row.value as T) : fallback
}

async function sharingEnabled() {
  return { ...DEFAULT_SETTINGS, ...(await getKv<Partial<Settings>>('settings', {})) }.shareUsage
}

/** A random id for this install. It is not tied to an account, a device identifier or an IP. */
async function installId(): Promise<string> {
  return db.transaction('rw', db.kv, async () => {
    const existing = await getKv<string | null>('installId', null)
    if (existing) return existing
    const id = newId()
    await db.kv.put({ key: 'installId', value: id })
    return id
  })
}

/** Queue one event. Does nothing when the user has turned usage sharing off. */
export function track(name: EventName, props?: EventProps, now = Date.now()) {
  return db.transaction('rw', db.kv, async () => {
    if (!(await sharingEnabled())) return
    const outbox = await getKv<TelemetryEvent[]>('outbox', [])
    outbox.push(props ? { name, ts: now, props } : { name, ts: now })
    await db.kv.put({ key: 'outbox', value: outbox.slice(-OUTBOX_LIMIT) })
  })
}

async function post(path: string, body: unknown): Promise<number> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    })
    return response.status
  } catch {
    return 0 // offline or blocked
  }
}

async function sendOutbox() {
  if (!(await sharingEnabled())) {
    await db.kv.delete('outbox') // sharing was turned off: discard what was waiting
    return
  }
  const batch = (await getKv<TelemetryEvent[]>('outbox', [])).slice(0, MAX_EVENTS_PER_BATCH)
  if (batch.length === 0) return
  const status = await post('/api/events', { installId: await installId(), appVersion: __APP_VERSION__, events: batch })
  // Sent, or rejected as malformed (retrying a 400 would block the queue forever). Anything
  // else — offline, 404 in local dev, a server error — keeps the batch for next time.
  const done = (status >= 200 && status < 300) || status === 400 || status === 413
  if (!done) return
  await db.transaction('rw', db.kv, async () => {
    const outbox = await getKv<TelemetryEvent[]>('outbox', [])
    await db.kv.put({ key: 'outbox', value: outbox.slice(batch.length) })
  })
}

let flushing: Promise<void> | null = null

/** Send what is waiting. Concurrent calls share one request. */
export function flush(): Promise<void> {
  flushing ??= sendOutbox().finally(() => {
    flushing = null
  })
  return flushing
}

/** Queue an event and try to send it. Never rejects. */
export function record(name: EventName, props?: EventProps) {
  track(name, props)
    .then(flush)
    .catch(error => console.error('[timebox] could not record usage', error))
}

/** Send feedback the user wrote. Returns whether the server accepted it. */
export async function sendFeedback(message: string, contact: string): Promise<boolean> {
  try {
    const status = await post('/api/feedback', {
      installId: await installId(),
      appVersion: __APP_VERSION__,
      message,
      contact,
    })
    return status >= 200 && status < 300
  } catch {
    return false
  }
}
