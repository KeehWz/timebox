import type { Session, SessionType } from './types'
import { sessionDuration } from './time'

export interface StatsCategory {
  typeId: string
  name: string
  duration: number
  activities: { name: string; duration: number }[]
}

/** Group sessions by category, then by activity (description), longest first. */
export function buildCategoryBreakdown(items: Session[]): StatsCategory[] {
  const categories = new Map<string, { name: string; duration: number; activities: Map<string, number> }>()
  for (const session of items) {
    const duration = sessionDuration(session)
    const current = categories.get(session.typeId) ?? {
      name: session.typeName,
      duration: 0,
      activities: new Map<string, number>(),
    }
    const activity = session.description.trim() || `General ${session.typeName}`
    current.name = session.typeName
    current.duration += duration
    current.activities.set(activity, (current.activities.get(activity) ?? 0) + duration)
    categories.set(session.typeId, current)
  }
  return Array.from(categories.entries())
    .map(([typeId, category]) => ({
      typeId,
      name: category.name,
      duration: category.duration,
      activities: Array.from(category.activities.entries())
        .map(([name, duration]) => ({ name, duration }))
        .sort((a, b) => b.duration - a.duration),
    }))
    .sort((a, b) => b.duration - a.duration)
}

export interface DayBlock {
  type: 'session' | 'unrecorded'
  session?: Session
  start: number
  end: number
}

/** The finished day as alternating recorded / unrecorded blocks between Start and End Today. */
export function buildDayBlocks(sessions: Session[], dayStart: number, dayEnd: number): DayBlock[] {
  const blocks: DayBlock[] = []
  let cursor = dayStart
  for (const session of [...sessions].sort((a, b) => a.startTime - b.startTime)) {
    if (session.startTime > cursor) blocks.push({ type: 'unrecorded', start: cursor, end: session.startTime })
    blocks.push({ type: 'session', session, start: session.startTime, end: session.endTime })
    cursor = Math.max(cursor, session.endTime)
  }
  if (cursor < dayEnd) blocks.push({ type: 'unrecorded', start: cursor, end: dayEnd })
  return blocks
}

const SESSION_COLOR: Record<string, string> = {
  work: '#4F6FEA',
  study: '#79C7F2',
  creative: '#8C73E6',
  exercise: '#F2A24B',
  rest: '#E9B85C',
  leisure: '#EFA23F',
  everyday: '#E8B253',
  social: '#F4A45E',
  other: '#D9963C',
}
const CUSTOM_CATEGORY_COLORS = ['#6685E8', '#6EB7D8', '#9B83D8', '#E59A69', '#79A9A2']

export function categoryColor(typeId: string, sessionTypes: SessionType[]): string {
  if (SESSION_COLOR[typeId]) return SESSION_COLOR[typeId]
  const index = Math.max(0, sessionTypes.findIndex(type => type.id === typeId))
  return CUSTOM_CATEGORY_COLORS[index % CUSTOM_CATEGORY_COLORS.length]
}
