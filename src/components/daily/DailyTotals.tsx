import type { CSSProperties } from 'react'
import type { Session } from '../../domain/session'
import type { CheckIn } from '../../domain/checkIn'
import type { DailyDirection } from '../../domain/dailyDirection'
import { compareToDirections } from '../../domain/dailyDirection'
import { categoryAccent } from '../../domain/categories'
import { formatDuration, summarizeDay } from '../../domain/time'
import { useCategoryResolver } from '../../hooks/useCategoryResolver'
import { useT } from '../../i18n/I18nContext'
import styles from './daily.module.css'

interface DailyTotalsProps {
  sessions: Session[]
  checkIns?: CheckIn[]
  directions?: DailyDirection[]
  now: number
}

export function DailyTotals({ sessions, checkIns = [], directions = [], now }: DailyTotalsProps) {
  const { t, locale } = useT()
  const resolve = useCategoryResolver()
  const summary = summarizeDay(sessions, now)
  const entries = Object.entries(summary.byCategory)
    .map(([id, ms]) => ({ category: resolve(id), ms }))
    .filter((entry) => entry.ms > 0)
    .sort((a, b) => b.ms - a.ms)

  if (entries.length === 0 && checkIns.length === 0) return null

  const comparisons = compareToDirections(directions, summary.byCategory)

  return (
    <section className={styles.totals} aria-label={t('daily.summaryTitle')}>
      <h2 className={styles.totalsTitle}>{t('daily.summaryTitle')}</h2>
      <ul className={styles.totalsList}>
        {entries.map(({ category, ms }) => (
          <li
            key={category.id}
            className={styles.totalRow}
            style={{ '--accent': categoryAccent(category) } as CSSProperties}
          >
            <span className={styles.totalDot} aria-hidden="true" />
            <span className={styles.totalLabel}>{category.displayLabel}</span>
            <span className={styles.totalValue}>{formatDuration(ms, locale)}</span>
          </li>
        ))}
      </ul>

      {/* intended vs actual — comparison only, no enforcement (spec §5 / §15) */}
      {comparisons.length > 0 && (
        <div className={styles.vsBlock}>
          <h3 className={styles.vsTitle}>{t('daily.vsTitle')}</h3>
          <ul className={styles.totalsList}>
            {comparisons.map((row) => {
              const category = resolve(row.categoryId)
              return (
                <li
                  key={row.categoryId}
                  className={styles.totalRow}
                  style={{ '--accent': categoryAccent(category) } as CSSProperties}
                >
                  <span className={styles.totalDot} aria-hidden="true" />
                  <span className={styles.totalLabel}>{category.displayLabel}</span>
                  <span className={styles.totalValue}>
                    {row.targetDurationMs === null
                      ? formatDuration(row.actualMs, locale)
                      : t('daily.vsValue', {
                          actual: formatDuration(row.actualMs, locale),
                          target: formatDuration(row.targetDurationMs, locale),
                        })}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className={styles.totalsFoot}>
        <span>
          {t('daily.counts', {
            sessions: sessions.length,
            checkins: checkIns.length,
          })}
        </span>
        <span>{t('daily.pausedTotal', { duration: formatDuration(summary.pausedTotalMs, locale) })}</span>
        <span>{t('daily.spanTotal', { duration: formatDuration(summary.spanTotalMs, locale) })}</span>
      </div>
    </section>
  )
}
