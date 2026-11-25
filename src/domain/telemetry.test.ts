import { describe, expect, it } from 'vitest'
import { MAX_EVENTS_PER_BATCH, MAX_MESSAGE_LENGTH, parseEventsPayload, parseFeedbackPayload } from './telemetry'

const base = { installId: 'install-1', appVersion: '2.0.0' }
const event = { name: 'session_end', ts: 1_700_000_000_000, props: { minutes: 42, focus: false } }

describe('parseEventsPayload', () => {
  it('accepts a well-formed batch', () => {
    const payload = { ...base, events: [event, { name: 'app_open', ts: 1 }] }
    expect(parseEventsPayload(payload)).toEqual(payload)
  })

  it('drops fields it does not know about', () => {
    const parsed = parseEventsPayload({ ...base, extra: 'x', events: [event] })
    expect(parsed).toEqual({ ...base, events: [event] })
  })

  it.each([
    ['not an object', 'nope'],
    ['missing install id', { appVersion: '2.0.0', events: [event] }],
    ['empty install id', { ...base, installId: '', events: [event] }],
    ['oversized install id', { ...base, installId: 'x'.repeat(65), events: [event] }],
    ['no events', { ...base, events: [] }],
    ['too many events', { ...base, events: Array(MAX_EVENTS_PER_BATCH + 1).fill(event) }],
    ['unknown event name', { ...base, events: [{ name: 'purchase', ts: 1 }] }],
    ['non-numeric timestamp', { ...base, events: [{ name: 'app_open', ts: 'now' }] }],
    ['infinite timestamp', { ...base, events: [{ name: 'app_open', ts: Infinity }] }],
    ['props that are an array', { ...base, events: [{ name: 'app_open', ts: 1, props: [1] }] }],
  ])('rejects %s', (_label, input) => {
    expect(parseEventsPayload(input)).toBeNull()
  })

  it('rejects text in props, so nothing a user typed can ride along', () => {
    expect(parseEventsPayload({ ...base, events: [{ name: 'session_end', ts: 1, props: { note: 'private' } }] })).toBeNull()
    expect(parseEventsPayload({ ...base, events: [{ name: 'session_end', ts: 1, props: { nested: { a: 1 } } }] })).toBeNull()
  })

  it('rejects the whole batch when one event is malformed', () => {
    expect(parseEventsPayload({ ...base, events: [event, { name: 'app_open' }] })).toBeNull()
  })
})

describe('parseFeedbackPayload', () => {
  it('trims the message and keeps a contact', () => {
    expect(parseFeedbackPayload({ ...base, message: '  Love the timeline.  ', contact: ' me@example.com ' })).toEqual({
      ...base,
      message: 'Love the timeline.',
      contact: 'me@example.com',
    })
  })

  it('treats a missing or blank contact as none', () => {
    expect(parseFeedbackPayload({ ...base, message: 'Hi' })).toEqual({ ...base, message: 'Hi' })
    expect(parseFeedbackPayload({ ...base, message: 'Hi', contact: '' })).toEqual({ ...base, message: 'Hi' })
    expect(parseFeedbackPayload({ ...base, message: 'Hi', contact: '   ' })).toEqual({ ...base, message: 'Hi' })
  })

  it.each([
    ['blank message', { ...base, message: '   ' }],
    ['non-string message', { ...base, message: 12 }],
    ['oversized message', { ...base, message: 'x'.repeat(MAX_MESSAGE_LENGTH + 1) }],
    ['oversized contact', { ...base, message: 'Hi', contact: 'x'.repeat(201) }],
    ['non-string contact', { ...base, message: 'Hi', contact: 5 }],
    ['missing app version', { installId: 'install-1', message: 'Hi' }],
  ])('rejects %s', (_label, input) => {
    expect(parseFeedbackPayload(input)).toBeNull()
  })
})
