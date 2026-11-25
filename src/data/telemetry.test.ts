import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from './db'
import { updateSettings } from './store'
import { flush, sendFeedback, track } from './telemetry'
import type { EventsPayload, TelemetryEvent } from '../domain/telemetry'

const fetchMock = vi.fn<(input: string, init: RequestInit) => Promise<{ status: number }>>()
const respond = (status: number) => fetchMock.mockResolvedValue({ status })
const outbox = async () => ((await db.kv.get('outbox'))?.value ?? []) as TelemetryEvent[]
const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body as string) as EventsPayload

beforeEach(async () => {
  await db.delete()
  await db.open()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  await updateSettings({ usageNoticeSeen: true })
})
afterEach(() => vi.unstubAllGlobals())

describe('usage events', () => {
  it('queues events and sends them as one batch', async () => {
    respond(200)
    await track('app_open', undefined, 1000)
    await track('session_end', { minutes: 25, focus: false }, 2000)
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/events')
    const body = sentBody()
    expect(body.appVersion).toMatch(/^\d+\.\d+\.\d+$/)
    expect(body.installId).toMatch(/^[0-9a-f-]{36}$/)
    expect(body.events).toEqual([
      { name: 'app_open', ts: 1000 },
      { name: 'session_end', ts: 2000, props: { minutes: 25, focus: false } },
    ])
    expect(await outbox()).toEqual([])
  })

  it('keeps the same install id across batches', async () => {
    respond(200)
    await track('app_open')
    await flush()
    await track('day_start')
    await flush()
    expect(sentBody(1).installId).toBe(sentBody(0).installId)
  })

  it('keeps events while offline and sends them later', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await track('session_end', { minutes: 5 }, 1000)
    await flush()
    expect(await outbox()).toHaveLength(1)

    respond(200)
    await track('day_end', undefined, 2000)
    await flush()
    expect(sentBody(1).events.map(event => event.name)).toEqual(['session_end', 'day_end'])
    expect(await outbox()).toEqual([])
  })

  it.each([404, 500, 503])('keeps events when the server answers %i', async status => {
    respond(status)
    await track('app_open')
    await flush()
    expect(await outbox()).toHaveLength(1)
  })

  it('drops a batch the server rejects as malformed, so the queue cannot jam', async () => {
    respond(400)
    await track('app_open')
    await flush()
    expect(await outbox()).toEqual([])
  })

  it('keeps events queued during a send', async () => {
    let finish: (value: { status: number }) => void = () => {}
    fetchMock.mockReturnValueOnce(new Promise(resolve => (finish = resolve)))
    await track('app_open', undefined, 1000)
    const sending = flush()
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await track('day_start', undefined, 2000)
    finish({ status: 200 })
    await sending
    expect(await outbox()).toEqual([{ name: 'day_start', ts: 2000 }])
  })

  it('does not call the network with nothing to send', async () => {
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('caps the outbox, keeping the most recent events', async () => {
    for (let i = 0; i < 505; i++) await track('app_open', undefined, i)
    const queued = await outbox()
    expect(queued).toHaveLength(500)
    expect(queued[0].ts).toBe(5)
  })
})

describe('before the first-launch note is answered', () => {
  beforeEach(() => updateSettings({ usageNoticeSeen: false }))

  it('queues events but sends nothing', async () => {
    respond(200)
    await track('app_open', undefined, 1000)
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await outbox()).toEqual([{ name: 'app_open', ts: 1000 }])
  })

  it('sends what was queued once the note is accepted', async () => {
    respond(200)
    await track('app_open', undefined, 1000)
    await updateSettings({ usageNoticeSeen: true })
    await flush()
    expect(sentBody().events).toEqual([{ name: 'app_open', ts: 1000 }])
  })

  it('discards what was queued when the note is declined', async () => {
    await track('app_open')
    await updateSettings({ usageNoticeSeen: true, shareUsage: false })
    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await outbox()).toEqual([])
  })
})

describe('sharing turned off', () => {
  it('records nothing and discards what was waiting', async () => {
    await track('app_open')
    await updateSettings({ shareUsage: false })
    await track('session_end', { minutes: 5 })
    expect(await outbox()).toHaveLength(1)

    await flush()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(await outbox()).toEqual([])
  })
})

describe('feedback', () => {
  it('posts the message and reports success', async () => {
    respond(200)
    expect(await sendFeedback('The timeline is lovely.', 'me@example.com')).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/feedback')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      message: 'The timeline is lovely.',
      contact: 'me@example.com',
    })
  })

  it('still sends when usage sharing is off — the user chose to write', async () => {
    respond(200)
    await updateSettings({ shareUsage: false })
    expect(await sendFeedback('Hi', '')).toBe(true)
  })

  it('reports failure when offline or rejected', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    expect(await sendFeedback('Hi', '')).toBe(false)
    respond(500)
    expect(await sendFeedback('Hi', '')).toBe(false)
  })
})
