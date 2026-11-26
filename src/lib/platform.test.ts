import { afterEach, describe, expect, it, vi } from 'vitest'

const capacitor = vi.hoisted(() => ({ native: false }))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => capacitor.native } }))

// platform.ts decides once, at import, so each case loads a fresh copy.
async function load(native: boolean) {
  capacitor.native = native
  vi.resetModules()
  return import('./platform')
}

afterEach(() => vi.unstubAllEnvs())

describe('apiUrl', () => {
  it('stays relative on the web, where the Worker serves both the app and the API', async () => {
    const { apiUrl, isNative } = await load(false)
    expect(isNative).toBe(false)
    expect(apiUrl('/api/events')).toBe('/api/events')
  })

  it('uses the production address in the iOS app', async () => {
    const { apiUrl, isNative } = await load(true)
    expect(isNative).toBe(true)
    expect(apiUrl('/api/events')).toBe('https://timebox.michaelwz2180.workers.dev/api/events')
  })

  it('can be pointed elsewhere at build time', async () => {
    vi.stubEnv('VITE_API_ORIGIN', 'https://staging.example')
    const { apiUrl } = await load(true)
    expect(apiUrl('/api/feedback')).toBe('https://staging.example/api/feedback')
  })
})
