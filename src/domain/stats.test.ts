import { describe, expect, it } from 'vitest'
import { buildCategoryBreakdown, buildDayBlocks, categoryColor } from './stats'
import { colorWithAlpha, formatClock, formatDuration, formatElapsed, formatRecordedTotal, formatSinceStart } from './format'
import type { Session } from './types'

const MIN = 60_000
const at = (h: number, m = 0) => new Date(2026, 10, 10, h, m).getTime()

const session = (id: string, typeId: string, start: number, end: number, description = ''): Session => ({
  id,
  typeId,
  typeName: typeId[0].toUpperCase() + typeId.slice(1),
  description,
  startTime: start,
  endTime: end,
  pausedDuration: 0,
})

describe('buildCategoryBreakdown', () => {
  it('groups by category and activity, longest first', () => {
    const breakdown = buildCategoryBreakdown([
      session('a', 'work', at(9), at(10), 'Report'),
      session('b', 'exercise', at(10), at(10, 30)),
      session('c', 'work', at(11), at(13), 'Meetings'),
      session('d', 'work', at(14), at(14, 30), ' Report '),
    ])
    expect(breakdown.map(category => [category.typeId, category.duration])).toEqual([
      ['work', 210 * MIN],
      ['exercise', 30 * MIN],
    ])
    expect(breakdown[0].activities).toEqual([
      { name: 'Meetings', duration: 120 * MIN },
      { name: 'Report', duration: 90 * MIN },
    ])
    expect(breakdown[1].activities).toEqual([{ name: 'General Exercise', duration: 30 * MIN }])
  })

  it('returns nothing for no sessions', () => {
    expect(buildCategoryBreakdown([])).toEqual([])
  })
})

describe('buildDayBlocks', () => {
  it('fills the gaps between Start Today and End Today with unrecorded blocks', () => {
    const blocks = buildDayBlocks(
      [session('b', 'exercise', at(11), at(12)), session('a', 'work', at(9), at(10))],
      at(8, 30),
      at(13),
    )
    expect(blocks.map(block => [block.type, block.start, block.end])).toEqual([
      ['unrecorded', at(8, 30), at(9)],
      ['session', at(9), at(10)],
      ['unrecorded', at(10), at(11)],
      ['session', at(11), at(12)],
      ['unrecorded', at(12), at(13)],
    ])
  })

  it('has no gaps when sessions are back to back and reach the end', () => {
    const blocks = buildDayBlocks([session('a', 'work', at(9), at(10)), session('b', 'work', at(10), at(11))], at(9), at(11))
    expect(blocks.every(block => block.type === 'session')).toBe(true)
  })

  it('is a single unrecorded block for an empty day', () => {
    expect(buildDayBlocks([], at(9), at(10))).toEqual([{ type: 'unrecorded', start: at(9), end: at(10) }])
  })
})

describe('categoryColor', () => {
  it('uses the fixed colour for known ids and a stable palette slot for custom ones', () => {
    const types = [
      { id: 'work', name: 'Work', description: '' },
      { id: 'custom-1', name: 'Reading', description: '' },
    ]
    expect(categoryColor('work', types)).toBe('#4F6FEA')
    expect(categoryColor('custom-1', types)).toBe('#6EB7D8')
    expect(categoryColor('deleted', types)).toBe('#6685E8')
  })
})

describe('formatting', () => {
  it('formats the timer face', () => {
    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(65_000)).toBe('01:05')
    expect(formatElapsed(3_725_000)).toBe('1:02:05')
  })

  it('formats soft durations', () => {
    expect(formatDuration(30_000)).toBe('a moment')
    expect(formatDuration(12 * MIN)).toBe('12m')
    expect(formatDuration(120 * MIN)).toBe('2h')
    expect(formatDuration(125 * MIN)).toBe('2h 5m')
  })

  it('formats totals and time since start', () => {
    expect(formatRecordedTotal(-5)).toBe('0m')
    expect(formatRecordedTotal(59 * MIN)).toBe('59m')
    expect(formatRecordedTotal(60 * MIN)).toBe('1h')
    expect(formatRecordedTotal(61 * MIN)).toBe('1h 1m')
    expect(formatSinceStart(5 * MIN)).toBe('5m')
    expect(formatSinceStart(65 * MIN)).toBe('1h 05m')
  })

  it('formats clock times in 12-hour form', () => {
    expect(formatClock(at(0, 5))).toBe('12:05am')
    expect(formatClock(at(12))).toBe('12:00pm')
    expect(formatClock(at(15, 18))).toBe('3:18pm')
  })

  it('adds alpha to hex colours and leaves others alone', () => {
    expect(colorWithAlpha('#4F6FEA', 0.5)).toBe('rgba(79, 111, 234, 0.5)')
    expect(colorWithAlpha('red', 0.5)).toBe('red')
  })
})
