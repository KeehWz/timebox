import { describe, it, expect } from 'vitest'
import {
  PX_PER_HOUR,
  gridWindow,
  gridHeight,
  yForMinute,
  minuteForY,
  clampBlockStart,
  hourMarks,
  formatMinute,
} from './dayGrid'

describe('gridWindow', () => {
  it('defaults to 7:00–21:00 with no content', () => {
    expect(gridWindow([])).toEqual({ startMin: 420, endMin: 1260 })
  })

  it('expands (rounded to whole hours) for content outside the default span', () => {
    const window = gridWindow([{ startMin: 6 * 60 + 30, endMin: 22 * 60 + 10 }])
    expect(window).toEqual({ startMin: 360, endMin: 1380 })
  })

  it('clamps to the day bounds', () => {
    const window = gridWindow([{ startMin: -30, endMin: 25 * 60 }])
    expect(window.startMin).toBe(0)
    expect(window.endMin).toBe(1440)
  })
})

describe('geometry', () => {
  const window = { startMin: 420, endMin: 1260 }

  it('height covers the window', () => {
    expect(gridHeight(window)).toBe(14 * PX_PER_HOUR)
  })

  it('yForMinute / minuteForY round-trip on snap boundaries', () => {
    const y = yForMinute(600, window) // 10:00
    expect(minuteForY(y, window, 15)).toBe(600)
  })

  it('minuteForY snaps down and clamps to the window', () => {
    expect(minuteForY(10, window, 30)).toBe(420)
    expect(minuteForY(-50, window, 15)).toBe(420)
    expect(minuteForY(100000, window, 15)).toBe(1260)
  })

  it('clampBlockStart keeps the block inside the window', () => {
    expect(clampBlockStart(1250, 60, window)).toBe(1200)
    expect(clampBlockStart(100, 60, window)).toBe(420)
  })

  it('hourMarks emits one mark per hour inclusive', () => {
    const marks = hourMarks(window)
    expect(marks[0]).toBe(420)
    expect(marks.at(-1)).toBe(1260)
    expect(marks).toHaveLength(15)
  })

  it('formatMinute renders h:mm', () => {
    expect(formatMinute(540)).toBe('9:00')
    expect(formatMinute(605)).toBe('10:05')
  })
})
