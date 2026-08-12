import { useState } from 'react'
import { useNow } from '../hooks/useNow'
import { useTodayStats } from '../hooks/useTodayStats'
import { useTasks } from '../hooks/useTasks'
import { useWeekSessions } from '../hooks/useWeekSessions'
import { useCategoryResolver } from '../hooks/useCategoryResolver'
import { weekDayKeys, focusMsByDay, currentStreak } from '../domain/weekStats'
import { doneCountOn } from '../domain/task'
import { activeMs } from '../domain/metrics'
import { formatDuration, toDayKey, dayKeyLabel } from '../domain/time'
import { useT } from '../i18n/I18nContext'
import { ScreenHeader } from '../components/shell/ScreenHeader'
import styles from '../components/stats/stats.module.css'

const BAR_MAX_PX = 78
/** Bars normalize against at least 2.5h so light days don't over-inflate. */
const BAR_REFERENCE_MS = 150 * 60_000

/** Stats tab (design: Timebox.dc.html): today cards, weekly bars with drill-down, streak. */
export function StatsScreen() {
  const { t, locale } = useT()
  const now = useNow()
  const resolve = useCategoryResolver()
  const stats = useTodayStats(now)
  const tasks = useTasks()
  const weekSessions = useWeekSessions(now)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  if (stats === undefined || weekSessions === undefined) {
    return <main className="app-shell" aria-busy="true" />
  }

  const today = toDayKey(now)
  const keys = weekDayKeys(now)
  const byDay = focusMsByDay(weekSessions, now)
  const streak = currentStreak(byDay, today)
  const tasksDoneToday = doneCountOn(tasks ?? [], today, toDayKey)
  const peakMs = Math.max(BAR_REFERENCE_MS, ...keys.map((key) => byDay[key] ?? 0))

  const dayLetters =
    locale === 'zh' ? ['一', '二', '三', '四', '五', '六', '日'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const daySessions =
    selectedDay === null
      ? []
      : weekSessions
          .filter((session) => session.dayKey === selectedDay && session.status === 'completed')
          .sort((a, b) => b.startedAt - a.startedAt)
  const dayTotal = selectedDay === null ? 0 : (byDay[selectedDay] ?? 0)

  return (
    <main className="app-shell">
      <ScreenHeader title={t('nav.stats')} />

      <div className={styles.cardsRow}>
        <div className={styles.card}>
          <h2 className={styles.cardKicker}>{t('stats.focusedToday')}</h2>
          <p className={styles.cardValue}>{formatDuration(stats.totalTrackedMs, locale)}</p>
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardKicker}>{t('stats.tasksDone')}</h2>
          <p className={styles.cardValue}>{tasksDoneToday}</p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardKicker}>{t('stats.thisWeek')}</h2>
        <div className={styles.week}>
          {keys.map((key, index) => {
            const ms = byDay[key] ?? 0
            const height = Math.max(4, Math.round((ms / peakMs) * BAR_MAX_PX))
            const isToday = key === today
            const selected = key === selectedDay
            return (
              <button
                key={key}
                type="button"
                className={styles.weekDay}
                aria-pressed={selected}
                aria-label={dayKeyLabel(key, locale)}
                onClick={() => setSelectedDay(selected ? null : key)}
              >
                <span
                  className={`${styles.bar} ${isToday ? styles.barToday : ''} ${
                    selected ? styles.barSelected : ''
                  }`}
                  style={{ height: `${height}px` }}
                />
                <span
                  className={
                    isToday || selected ? `${styles.barLabel} ${styles.barLabelOn}` : styles.barLabel
                  }
                >
                  {dayLetters[index]}
                </span>
              </button>
            )
          })}
        </div>

        {selectedDay !== null && (
          <div className={styles.daySummary}>
            <div className={styles.daySummaryHead}>
              <span className={styles.dayName}>
                {dayKeyLabel(selectedDay, locale)}
                {selectedDay === today && t('stats.dayToday')}
              </span>
              <span className={styles.dayTotal}>
                {t('stats.dayFocused', { duration: formatDuration(dayTotal, locale) })}
              </span>
            </div>
            {daySessions.length === 0 ? (
              <p className={styles.dayEmpty}>{t('stats.dayEmpty')}</p>
            ) : (
              <ul className={styles.dayList}>
                {daySessions.map((session) => (
                  <li key={session.id} className={styles.dayRow}>
                    <span className={styles.dayRowTitle}>
                      <span className={styles.dayDot} aria-hidden="true" />
                      {session.note || resolve(session.categoryId).displayLabel}
                    </span>
                    <span className={styles.dayRowMins}>
                      {formatDuration(activeMs(session, now), locale)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className={styles.streakCard}>
        <span className={styles.streakLabel}>{t('stats.streak')}</span>
        <span className={styles.streakValue}>
          {streak === 1 ? t('stats.streakValueOne') : t('stats.streakValue', { days: streak })}
        </span>
      </div>
    </main>
  )
}
