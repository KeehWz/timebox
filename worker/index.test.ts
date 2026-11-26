// @vitest-environment node
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handle, type D1, type D1Statement, type Env } from './index'

/** The slice of D1 the Worker uses, backed by a real in-memory SQLite so the SQL itself is exercised. */
function sqliteD1(sqlite: DatabaseSync): D1 & { batches: number } {
  const statement = (sql: string, values: unknown[] = []): D1Statement & { exec(): void } => ({
    bind: (...next: unknown[]) => statement(sql, next),
    run: async () => statement(sql, values).exec(),
    exec: () => {
      sqlite.prepare(sql).run(...(values as (string | number | null)[]))
    },
  })
  const d1 = {
    batches: 0,
    prepare: (sql: string) => statement(sql),
    batch: async (statements: D1Statement[]) => {
      d1.batches++
      for (const item of statements) (item as ReturnType<typeof statement>).exec()
    },
  }
  return d1
}

const DAY = 86_400_000
const NOW = Date.UTC(2026, 10, 25, 12)
const base = { installId: 'install-1', appVersion: '2.0.0' }

let sqlite: DatabaseSync
let env: Env & { DB: ReturnType<typeof sqliteD1> }

const post = (path: string, body: unknown) =>
  handle(new Request(`https://timebox.test${path}`, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) }), env, NOW)

const rows = (sql: string) => sqlite.prepare(sql).all() as Record<string, unknown>[]

beforeEach(() => {
  sqlite = new DatabaseSync(':memory:')
  env = {
    DB: sqliteD1(sqlite),
    ASSETS: { fetch: vi.fn(async () => new Response('<html>app</html>')) },
  }
})

describe('POST /api/events', () => {
  it('stores a batch, creating the tables on first use', async () => {
    const response = await post('/api/events', {
      ...base,
      events: [
        { name: 'app_open', ts: NOW - 5000 },
        { name: 'session_end', ts: NOW - 1000.4, props: { minutes: 42, focus: true } },
      ],
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ saved: 2 })
    expect(rows('SELECT install_id, app_version, name, props, ts, received_at FROM events ORDER BY id')).toEqual([
      { install_id: 'install-1', app_version: '2.0.0', name: 'app_open', props: null, ts: NOW - 5000, received_at: NOW },
      { install_id: 'install-1', app_version: '2.0.0', name: 'session_end', props: '{"minutes":42,"focus":true}', ts: NOW - 1000, received_at: NOW },
    ])
  })

  it('creates the schema once, not on every request', async () => {
    await post('/api/events', { ...base, events: [{ name: 'app_open', ts: 1 }] })
    await post('/api/events', { ...base, events: [{ name: 'app_open', ts: 2 }] })
    expect(env.DB.batches).toBe(3) // 1 schema + 2 inserts
    expect(rows('SELECT COUNT(*) AS n FROM events')[0].n).toBe(2)
  })

  it('rejects malformed batches without touching the database', async () => {
    expect((await post('/api/events', { ...base, events: [{ name: 'purchase', ts: 1 }] })).status).toBe(400)
    expect((await post('/api/events', '{not json')).status).toBe(400)
    expect((await post('/api/events', 'x'.repeat(70_000))).status).toBe(413)
    expect(env.DB.batches).toBe(0)
  })

  it('stores the arrival time when a device clock is far off, so one bad clock cannot skew retention', async () => {
    await post('/api/events', {
      ...base,
      events: [
        { name: 'app_open', ts: 0 },
        { name: 'app_open', ts: NOW - 31 * DAY },
        { name: 'app_open', ts: NOW + 2 * DAY },
        { name: 'app_open', ts: NOW - 29 * DAY }, // a long offline stretch is still believed
        { name: 'app_open', ts: NOW + DAY / 2 }, // as is a clock a few hours ahead
      ],
    })
    expect(rows('SELECT ts FROM events ORDER BY id').map(row => row.ts)).toEqual([NOW, NOW, NOW, NOW - 29 * DAY, NOW + DAY / 2])
  })

  it('refuses an oversized body from its declared length, without reading it', async () => {
    const request = new Request('https://timebox.test/api/events', {
      method: 'POST',
      headers: { 'content-length': '50000000' },
      body: '{}',
    })
    const response = await handle(request, env, NOW)
    expect(response.status).toBe(413)
    expect(request.bodyUsed).toBe(false)
  })

  it('only accepts POST', async () => {
    const response = await handle(new Request('https://timebox.test/api/events'), env, NOW)
    expect(response.status).toBe(405)
  })
})

describe('POST /api/feedback', () => {
  it('stores the message and optional contact', async () => {
    expect((await post('/api/feedback', { ...base, message: ' The weekly view is great. ', contact: 'me@example.com' })).status).toBe(200)
    expect((await post('/api/feedback', { ...base, message: "Robert'); DROP TABLE feedback;--" })).status).toBe(200)
    expect(rows('SELECT message, contact, received_at FROM feedback ORDER BY id')).toEqual([
      { message: 'The weekly view is great.', contact: 'me@example.com', received_at: NOW },
      { message: "Robert'); DROP TABLE feedback;--", contact: null, received_at: NOW },
    ])
  })

  it('rejects an empty message', async () => {
    expect((await post('/api/feedback', { ...base, message: '  ' })).status).toBe(400)
  })
})

describe('rate limiting', () => {
  const limiter = (allow: boolean) => ({ limit: vi.fn(async () => ({ success: allow })) })

  it('answers 429 over the limit without touching the database', async () => {
    env.EVENTS_LIMITER = limiter(false)
    const response = await handle(
      new Request('https://timebox.test/api/events', {
        method: 'POST',
        headers: { 'cf-connecting-ip': '203.0.113.7' },
        body: JSON.stringify({ ...base, events: [{ name: 'app_open', ts: NOW }] }),
      }),
      env,
      NOW,
    )
    expect(response.status).toBe(429)
    expect(env.EVENTS_LIMITER.limit).toHaveBeenCalledWith({ key: '203.0.113.7' })
    expect(env.DB.batches).toBe(0)
  })

  it('uses a separate, stricter limiter for feedback', async () => {
    env.EVENTS_LIMITER = limiter(true)
    env.FEEDBACK_LIMITER = limiter(false)
    expect((await post('/api/feedback', { ...base, message: 'Hi' })).status).toBe(429)
    expect((await post('/api/events', { ...base, events: [{ name: 'app_open', ts: NOW }] })).status).toBe(200)
    expect(env.EVENTS_LIMITER.limit).toHaveBeenCalledWith({ key: 'unknown' })
  })

  it('never limits static assets', async () => {
    env.EVENTS_LIMITER = limiter(false)
    env.FEEDBACK_LIMITER = limiter(false)
    expect((await handle(new Request('https://timebox.test/'), env, NOW)).status).toBe(200)
  })
})

describe('CORS for the iOS app', () => {
  const NATIVE = 'capacitor://localhost'
  const request = (method: string, origin: string, path = '/api/events') =>
    new Request(`https://timebox.test${path}`, {
      method,
      headers: { origin, 'content-type': 'application/json' },
      ...(method === 'POST' ? { body: JSON.stringify({ ...base, events: [{ name: 'app_open', ts: NOW }] }) } : {}),
    })

  it('answers the preflight from the app, without counting it against the rate limit', async () => {
    env.EVENTS_LIMITER = { limit: vi.fn(async () => ({ success: false })) }
    const response = await handle(request('OPTIONS', NATIVE), env, NOW)
    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe(NATIVE)
    expect(response.headers.get('access-control-allow-methods')).toBe('POST')
    expect(response.headers.get('access-control-allow-headers')).toBe('content-type')
    expect(env.EVENTS_LIMITER.limit).not.toHaveBeenCalled()
  })

  it('lets the app read API responses, including errors', async () => {
    const ok = await handle(request('POST', NATIVE), env, NOW)
    expect(ok.status).toBe(200)
    expect(ok.headers.get('access-control-allow-origin')).toBe(NATIVE)
    const missing = await handle(request('POST', NATIVE, '/api/nope'), env, NOW)
    expect(missing.status).toBe(404)
    expect(missing.headers.get('access-control-allow-origin')).toBe(NATIVE)
  })

  it('grants nothing to other origins', async () => {
    const preflightResponse = await handle(request('OPTIONS', 'https://evil.example'), env, NOW)
    expect(preflightResponse.headers.get('access-control-allow-origin')).toBeNull()
    expect(preflightResponse.headers.get('access-control-allow-methods')).toBeNull()
    const post = await handle(request('POST', 'https://evil.example'), env, NOW)
    expect(post.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('routing and failures', () => {
  it('serves everything outside /api from static assets', async () => {
    const request = new Request('https://timebox.test/')
    const response = await handle(request, env, NOW)
    expect(await response.text()).toBe('<html>app</html>')
    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request)
  })

  it('answers unknown API paths with 404 instead of the app shell', async () => {
    expect((await post('/api/nope', {})).status).toBe(404)
    expect(env.ASSETS.fetch).not.toHaveBeenCalled()
  })

  it('returns 500 when the database fails, and recovers on the next request', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const batch = env.DB.batch
    env.DB.batch = async () => {
      throw new Error('D1 unavailable')
    }
    expect((await post('/api/events', { ...base, events: [{ name: 'app_open', ts: 1 }] })).status).toBe(500)

    env.DB.batch = batch
    expect((await post('/api/events', { ...base, events: [{ name: 'app_open', ts: 1 }] })).status).toBe(200)
    error.mockRestore()
  })
})

describe('scripts/metrics.sql', () => {
  it('runs against the schema and reports retention', async () => {
    const send = (installId: string, daysAgo: number, name: string, props?: Record<string, number | boolean>) =>
      post('/api/events', { installId, appVersion: '2.0.0', events: [{ name, ts: NOW - daysAgo * DAY, ...(props ? { props } : {}) }] })

    // "keeper" installed 8 days ago and is still recording on day 7; "lapsed" stopped after day 1;
    // "new" installed yesterday.
    await send('keeper', 8, 'app_open')
    await send('keeper', 8, 'session_end', { minutes: 30 })
    await send('keeper', 1, 'session_end', { minutes: 50 })
    await send('lapsed', 8, 'app_open')
    await send('lapsed', 7, 'session_end', { minutes: 10 })
    await send('new', 1, 'app_open')
    await post('/api/feedback', { ...base, message: 'Hello' })

    // SQLite's 'now' is the real clock; pin it by rewriting the one place the script uses it.
    const script = readFileSync('scripts/metrics.sql', 'utf8').replace(
      "CAST(strftime('%s', 'now') AS INTEGER) * 1000",
      String(NOW),
    )
    const results = script
      .split(';')
      .map(part => part.replace(/^\s*--.*$/gm, '').trim())
      .filter(Boolean)
      .map(rows)

    expect(results).toHaveLength(5)
    expect(results[0]).toEqual([{ installs: 3, installs_that_recorded: 2 }])
    expect(results[1]).toEqual([
      { day: 1, eligible: 3, still_recording: 2 },
      { day: 3, eligible: 2, still_recording: 1 },
      { day: 7, eligible: 2, still_recording: 1 },
    ])
    expect(results[3]).toEqual([{ sessions_per_active_day: 1, avg_minutes: 30 }])
    expect(results[4]).toMatchObject([{ message: 'Hello', app_version: '2.0.0' }])
  })
})
