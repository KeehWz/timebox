import { beforeEach, describe, expect, it, vi } from 'vitest'

const plugin = vi.hoisted(() => ({
  cancel: vi.fn(async () => {}),
  schedule: vi.fn(async () => ({ notifications: [] })),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' })),
}))
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }))

const nudge = { id: 1, at: Date.UTC(2026, 10, 10, 17), title: 'Work', body: 'A gentle check-in — 1h so far.' }
const unmarked = { id: 2, at: Date.UTC(2026, 10, 10, 18), title: 'TimeBox', body: 'Ready to mark your time?' }

// The module keeps what it last applied, so each test gets a fresh copy.
async function load() {
  vi.resetModules()
  return (await import('./notifications')).syncNotifications
}

beforeEach(() => {
  for (const fn of Object.values(plugin)) fn.mockClear()
  plugin.checkPermissions.mockResolvedValue({ display: 'granted' })
  plugin.requestPermissions.mockResolvedValue({ display: 'granted' })
})

describe('syncNotifications', () => {
  it('replaces what is pending with the plan', async () => {
    const sync = await load()
    await sync([nudge])
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: 1 }, { id: 2 }] })
    expect(plugin.schedule).toHaveBeenCalledWith({
      notifications: [{ id: 1, title: 'Work', body: nudge.body, schedule: { at: new Date(nudge.at), allowWhileIdle: true } }],
    })
  })

  it('does nothing when the plan has not changed', async () => {
    const sync = await load()
    await sync([nudge])
    await sync([nudge])
    expect(plugin.cancel).toHaveBeenCalledTimes(1)
    expect(plugin.schedule).toHaveBeenCalledTimes(1)
  })

  it('only cancels when there is nothing to schedule, without asking for permission', async () => {
    const sync = await load()
    await sync([])
    expect(plugin.cancel).toHaveBeenCalledTimes(1)
    expect(plugin.checkPermissions).not.toHaveBeenCalled()
    expect(plugin.schedule).not.toHaveBeenCalled()
  })

  it('asks for permission the first time, and schedules nothing if it is refused', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' })
    plugin.requestPermissions.mockResolvedValue({ display: 'denied' })
    const sync = await load()
    await sync([unmarked])
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1)
    expect(plugin.schedule).not.toHaveBeenCalled()
  })

  it('applies quick successive plans in order, ending with the last one', async () => {
    const sync = await load()
    void sync([nudge])
    await sync([unmarked])
    expect(plugin.schedule).toHaveBeenLastCalledWith({
      notifications: [expect.objectContaining({ id: 2 })],
    })
  })

  it('retries after a failure instead of treating the plan as applied', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    plugin.schedule.mockRejectedValueOnce(new Error('denied by system'))
    const sync = await load()
    await sync([nudge])
    await sync([nudge])
    expect(plugin.schedule).toHaveBeenCalledTimes(2)
    error.mockRestore()
  })
})
