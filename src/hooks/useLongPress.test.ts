import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { act, renderHook } from '@testing-library/react'
import { HOLD_DURATION_MS, useLongPress } from './useLongPress'

// Controllable clock + rAF queue so we can drive the hold deterministically.
let nowValue = 0
let rafId = 0
let rafMap = new Map<number, FrameRequestCallback>()

function flushFrames() {
  const entries = [...rafMap.entries()]
  rafMap.clear()
  for (const [, cb] of entries) cb(nowValue)
}

function fakePointerEvent(): ReactPointerEvent {
  return { preventDefault: () => {} } as unknown as ReactPointerEvent
}

beforeEach(() => {
  nowValue = 0
  rafId = 0
  rafMap = new Map()
  vi.spyOn(performance, 'now').mockImplementation(() => nowValue)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = ++rafId
    rafMap.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafMap.delete(id)
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useLongPress', () => {
  it('fires onComplete once when held for the full duration', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useLongPress(onComplete, 1000))

    act(() => result.current.handlers.onPointerDown(fakePointerEvent()))
    act(() => {
      nowValue = 500
      flushFrames()
    })
    expect(onComplete).not.toHaveBeenCalled()
    expect(result.current.progress).toBeCloseTo(0.5, 5)

    act(() => {
      nowValue = 1000
      flushFrames()
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(result.current.progress).toBe(1)

    // further frames must not re-fire
    act(() => {
      nowValue = 2000
      flushFrames()
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('cancels and resets progress when released early', () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useLongPress(onComplete, 1000))

    act(() => result.current.handlers.onPointerDown(fakePointerEvent()))
    act(() => {
      nowValue = 400
      flushFrames()
    })
    expect(result.current.progress).toBeCloseTo(0.4, 5)

    act(() => result.current.handlers.onPointerUp())
    expect(result.current.progress).toBe(0)

    act(() => {
      nowValue = 2000
      flushFrames()
    })
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('default hold duration is within the 1.5–2s ritual range', () => {
    expect(HOLD_DURATION_MS).toBeGreaterThanOrEqual(1500)
    expect(HOLD_DURATION_MS).toBeLessThanOrEqual(2000)
  })
})
