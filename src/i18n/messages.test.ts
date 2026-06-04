import { describe, it, expect } from 'vitest'
import { messages } from './messages'

const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort()

describe('messages', () => {
  it('en has exactly the same keys as zh', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.zh).sort())
  })

  it('every value is a non-empty string', () => {
    for (const dict of [messages.zh, messages.en] as Record<string, string>[]) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value, key).toBeTypeOf('string')
        expect(value.length, key).toBeGreaterThan(0)
      }
    }
  })

  it('keeps identical interpolation placeholders across locales', () => {
    for (const key of Object.keys(messages.zh) as (keyof typeof messages.zh)[]) {
      expect(placeholders(messages.en[key]), key).toEqual(placeholders(messages.zh[key]))
    }
  })
})
