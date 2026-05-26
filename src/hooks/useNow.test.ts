import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useNow } from './useNow'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useNow', () => {
  it('advances on each interval tick', () => {
    const { result } = renderHook(() => useNow(1000))
    const first = result.current
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current).toBeGreaterThan(first)
  })

  it('reflects total elapsed time after several ticks', () => {
    const { result } = renderHook(() => useNow(1000))
    const first = result.current
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current - first).toBeGreaterThanOrEqual(3000)
  })
})
