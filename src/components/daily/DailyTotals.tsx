import type { CSSProperties } from 'react'
import type { Session } from '../../domain/session'
import { CATEGORIES } from '../../domain/categories'
import { formatDuration, summarizeDay } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import styles from './daily.module.css'

interface DailyTotalsProps {
  sessions: Session[]
  now: number
}

export function DailyTotals({ sessions, now }: DailyTotalsProps) {
  const { t, locale } = useT()
  const summary = summarizeDay(sessions, now)
  const entries = CATEGORIES.map((category) => ({
    category,
    ms: summary.byCategory[category.id] ?? 0,
  }))
    .filter((entry) => entry.ms > 0)
    .sort((a, b) => b.ms - a.ms)

  if (entries.length === 0) return null

  return (
    <section className={styles.totals} aria-label={t('daily.summaryTitle')}>
      <h2 className={styles.totalsTitle}>{t('daily.summaryTitle')}</h2>
      <ul className={styles.totalsList}>
        {entries.map(({ category, ms }) => (
          <li
            key={category.id}
            className={styles.totalRow}
            style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
          >
            <span className={styles.totalDot} aria-hidden="true" />
            <span className={styles.totalLabel}>{t(`category.${category.id}.label`)}</span>
            <span className={styles.totalValue}>{formatDuration(ms, locale)}</span>
          </li>
        ))}
      </ul>
      <div className={styles.totalsFoot}>
        <span>{t('daily.pausedTotal', { duration: formatDuration(summary.pausedTotalMs, locale) })}</span>
        <span>{t('daily.spanTotal', { duration: formatDuration(summary.spanTotalMs, locale) })}</span>
      </div>
    </section>
  )
}
