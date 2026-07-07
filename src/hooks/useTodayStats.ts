import { useMemo } from 'react'
import { toDayKey } from '../domain/time'
import { computeTodayStats, type TodayStats } from '../domain/todayStats'
import { useDailySessions } from './useDailySessions'

/** Live TodayStats for the local day containing `now`. `undefined` while loading. */
export function useTodayStats(now: number): TodayStats | undefined {
  const sessions = useDailySessions(toDayKey(now))
  return useMemo(() => (sessions ? computeTodayStats(sessions, now) : undefined), [sessions, now])
}
