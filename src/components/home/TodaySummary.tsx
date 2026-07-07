import type { TodayStats } from '../../domain/todayStats'
import { formatDuration } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import styles from './home.module.css'

interface TodaySummaryProps {
  stats: TodayStats
}

/** Home State B: compact "today so far" readout (spec §1). */
export function TodaySummary({ stats }: TodaySummaryProps) {
  const { t, locale } = useT()
  return (
    <section className={styles.summaryCard} aria-labelledby="today-summary-heading">
      <h1 id="today-summary-heading" className={styles.summaryTitle}>
        {t('home.summaryTitle')}
      </h1>
      <p className={styles.summaryValue}>{formatDuration(stats.totalTrackedMs, locale)}</p>
      <p className={styles.summaryMeta}>{t('home.sessionsCount', { count: stats.sessionCount })}</p>
    </section>
  )
}
