import { describe, it, expect } from 'vitest'
import {
  addDays,
  dayKeyLabel,
  formatClock,
  formatDuration,
  formatHuman,
  formatTimeOfDay,
  summarizeDay,
  toDayKey,
} from './time'
import type { Session } from './session'

describe('formatClock', () => {
  it('formats zero', () => {
    expect(formatClock(0)).toBe('00:00:00')
  })
  it('pads minutes and seconds', () => {
    expect(formatClock(62_000)).toBe('00:01:02')
  })
  it('handles hours', () => {
    expect(formatClock(3_723_000)).toBe('01:02:03')
  })
  it('clamps negatives', () => {
    expect(formatClock(-5_000)).toBe('00:00:00')
  })
})

describe('formatHuman', () => {
  it('zero -> 0s', () => {
    expect(formatHuman(0)).toBe('0s')
  })
  it('sub-minute -> seconds', () => {
    expect(formatHuman(44_000)).toBe('44s')
  })
  it('exact minute', () => {
    expect(formatHuman(60_000)).toBe('1m')
  })
  it('minutes and seconds', () => {
    expect(formatHuman(90_000)).toBe('1m 30s')
  })
  it('40 minutes', () => {
    expect(formatHuman(2_400_000)).toBe('40m')
  })
  it('hours and minutes', () => {
    expect(formatHuman(4_440_000)).toBe('1h 14m')
  })
  it('exact hour', () => {
    expect(formatHuman(3_600_000)).toBe('1h 0m')
  })
})

describe('formatDuration', () => {
  it('en matches the English style', () => {
    expect(formatDuration(4_440_000, 'en')).toBe('1h 14m')
    expect(formatDuration(2_400_000, 'en')).toBe('40m')
    expect(formatDuration(44_000, 'en')).toBe('44s')
    expect(formatDuration(0, 'en')).toBe('0s')
  })
  it('zh uses Chinese units without separators', () => {
    expect(formatDuration(4_440_000, 'zh')).toBe('1时14分')
    expect(formatDuration(2_400_000, 'zh')).toBe('40分')
    expect(formatDuration(90_000, 'zh')).toBe('1分30秒')
    expect(formatDuration(44_000, 'zh')).toBe('44秒')
  })
})

describe('dayKeyLabel', () => {
  it('formats an English long date', () => {
    const label = dayKeyLabel('2026-05-28', 'en')
    expect(label).toContain('May')
    expect(label).toContain('28')
    expect(label).toContain('2026')
  })
  it('formats a Chinese long date', () => {
    const label = dayKeyLabel('2026-05-28', 'zh')
    expect(label).toContain('年')
    expect(label).toContain('2026')
    expect(label).toContain('28')
  })
})

describe('formatTimeOfDay / toDayKey / addDays (local)', () => {
  it('formats a local time', () => {
    const d = new Date(2026, 4, 26, 14, 5) // 2026-05-26 14:05 local
    expect(formatTimeOfDay(d.getTime())).toBe('14:05')
  })
  it('derives a local dayKey, not UTC', () => {
    const lateNight = new Date(2026, 4, 26, 23, 30) // local
    expect(toDayKey(lateNight.getTime())).toBe('2026-05-26')
  })
  it('pads single-digit month and day', () => {
    const d = new Date(2026, 0, 3, 9, 0) // Jan 3
    expect(toDayKey(d.getTime())).toBe('2026-01-03')
  })
  it('adds and subtracts days across month boundaries', () => {
    expect(addDays('2026-05-31', 1)).toBe('2026-06-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-05-26', 0)).toBe('2026-05-26')
  })
})

describe('summarizeDay', () => {
  const base: Session = {
    id: '',
    categoryId: 'work',
    note: '',
    startedAt: 0,
    endedAt: 0,
    pauses: [],
    status: 'completed',
    dayKey: '2026-05-26',
    createdAt: 0,
    updatedAt: 0,
  }
  it('rolls up focus by category, plus paused and span totals', () => {
    const sessions: Session[] = [
      // work: span 60s, paused 10s, focus 50s
      { ...base, id: 'a', categoryId: 'work', startedAt: 0, endedAt: 60_000, pauses: [{ pausedAt: 10_000, resumedAt: 20_000 }] },
      // work: focus 30s
      { ...base, id: 'b', categoryId: 'work', startedAt: 0, endedAt: 30_000 },
      // study: focus 40s
      { ...base, id: 'c', categoryId: 'study', startedAt: 0, endedAt: 40_000 },
      // rest: still active -> ignored
      { ...base, id: 'd', categoryId: 'rest', startedAt: 0, endedAt: null, status: 'active' },
    ]
    const summary = summarizeDay(sessions, 1_000_000)
    expect(summary.byCategory.work).toBe(80_000)
    expect(summary.byCategory.study).toBe(40_000)
    expect(summary.byCategory.rest).toBeUndefined()
    expect(summary.pausedTotalMs).toBe(10_000)
    expect(summary.spanTotalMs).toBe(130_000)
  })
})
