import { parseEventsPayload, parseFeedbackPayload } from '../src/domain/telemetry'

// Only what this Worker uses of the Cloudflare bindings, so no extra type package is needed.
export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  run(): Promise<unknown>
}
export interface D1 {
  prepare(sql: string): D1Statement
  batch(statements: D1Statement[]): Promise<unknown>
}
export interface Env {
  DB: D1
  ASSETS: { fetch(request: Request): Promise<Response> }
}

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    install_id TEXT NOT NULL,
    app_version TEXT NOT NULL,
    name TEXT NOT NULL,
    props TEXT,
    ts INTEGER NOT NULL,
    received_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS events_install_ts ON events (install_id, ts)`,
  `CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    install_id TEXT NOT NULL,
    app_version TEXT NOT NULL,
    message TEXT NOT NULL,
    contact TEXT,
    received_at INTEGER NOT NULL
  )`,
]

const MAX_BODY_LENGTH = 64 * 1024
const DAY_MS = 86_400_000

/**
 * Device timestamps drive the retention numbers, so one wrong clock would skew them. A time more
 * than a day ahead or a month behind the server is replaced by the arrival time. A month allows
 * for events queued during a long offline stretch.
 */
function plausibleTime(ts: number, now: number) {
  const rounded = Math.round(ts)
  return rounded > now + DAY_MS || rounded < now - 30 * DAY_MS ? now : rounded
}

// The schema is created on first use, once per isolate, so deploying needs no migration step.
const ready = new WeakMap<D1, Promise<unknown>>()
function ensureSchema(db: D1) {
  let pending = ready.get(db)
  if (!pending) {
    pending = db.batch(SCHEMA.map(sql => db.prepare(sql)))
    pending.catch(() => ready.delete(db)) // retry on the next request
    ready.set(db, pending)
  }
  return pending
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

async function readJson(request: Request): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  if (request.method !== 'POST') return { ok: false, response: json({ error: 'method not allowed' }, 405) }
  // Refuse on the declared size first, so an oversized body is never buffered.
  if (Number(request.headers.get('content-length')) > MAX_BODY_LENGTH) {
    return { ok: false, response: json({ error: 'too large' }, 413) }
  }
  const text = await request.text()
  if (text.length > MAX_BODY_LENGTH) return { ok: false, response: json({ error: 'too large' }, 413) }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, response: json({ error: 'invalid json' }, 400) }
  }
}

async function saveEvents(request: Request, db: D1, now: number) {
  const body = await readJson(request)
  if (!body.ok) return body.response
  const payload = parseEventsPayload(body.value)
  if (!payload) return json({ error: 'invalid events' }, 400)
  await ensureSchema(db)
  const insert = db.prepare(
    'INSERT INTO events (install_id, app_version, name, props, ts, received_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
  await db.batch(
    payload.events.map(event =>
      insert.bind(
        payload.installId,
        payload.appVersion,
        event.name,
        event.props ? JSON.stringify(event.props) : null,
        plausibleTime(event.ts, now),
        now,
      ),
    ),
  )
  return json({ saved: payload.events.length }, 200)
}

async function saveFeedback(request: Request, db: D1, now: number) {
  const body = await readJson(request)
  if (!body.ok) return body.response
  const payload = parseFeedbackPayload(body.value)
  if (!payload) return json({ error: 'invalid feedback' }, 400)
  await ensureSchema(db)
  await db
    .prepare('INSERT INTO feedback (install_id, app_version, message, contact, received_at) VALUES (?, ?, ?, ?, ?)')
    .bind(payload.installId, payload.appVersion, payload.message, payload.contact ?? null, now)
    .run()
  return json({ saved: 1 }, 200)
}

/** Request handler, separate from the default export so tests can call it with a fake `Env`. */
export async function handle(request: Request, env: Env, now = Date.now()): Promise<Response> {
  const { pathname } = new URL(request.url)
  try {
    if (pathname === '/api/events') return await saveEvents(request, env.DB, now)
    if (pathname === '/api/feedback') return await saveFeedback(request, env.DB, now)
  } catch (error) {
    console.error('[timebox] api failed', error)
    return json({ error: 'server error' }, 500)
  }
  if (pathname.startsWith('/api/')) return json({ error: 'not found' }, 404)
  return env.ASSETS.fetch(request)
}

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
}
