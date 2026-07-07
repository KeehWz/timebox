import { useEffect } from 'react'
import { prefsRepository } from '../data/prefsRepository'
import { dayKeyTimeToEpoch, toDayKey } from '../domain/time'
import { useNow } from './useNow'
import { usePref } from './usePref'
import { useTodayStats } from './useTodayStats'
import { useT } from '../i18n/I18nContext'

const MINUTE_MS = 60_000

/**
 * First-session reminder (spec §2), within web limits (v2 plan Decision 4): fires a local
 * Notification while the app is open/alive, once per day, if the configured time has passed
 * and nothing has been tracked yet. Reliable closed-app scheduling needs push or the
 * Phase 4 native wrapper.
 */
export function useFirstSessionReminder(): void {
  const now = useNow(MINUTE_MS)
  const reminder = usePref('reminder')
  const lastFiredOn = usePref('reminderLastFiredOn')
  const stats = useTodayStats(now)
  const { t } = useT()

  useEffect(() => {
    if (!reminder?.firstSessionTime || stats === undefined || stats.hasSession) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const todayKey = toDayKey(now)
    if (lastFiredOn === todayKey) return
    if (now < dayKeyTimeToEpoch(todayKey, reminder.firstSessionTime)) return

    new Notification(t('notification.firstSession.title'), {
      body: t('notification.firstSession.body'),
    })
    void prefsRepository.set('reminderLastFiredOn', todayKey)
  }, [reminder, lastFiredOn, stats, now, t])
}
