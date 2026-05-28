import type { CSSProperties } from 'react'
import type { Session } from '../../domain/session'
import { CATEGORIES } from '../../domain/categories'
import { formatHuman, summarizeDay } from '../../domain/time'
import styles from './daily.module.css'

interface DailyTotalsProps {
  sessions: Session[]
  now: number
}

export function DailyTotals({ sessions, now }: DailyTotalsProps) {
  const summary = summarizeDay(sessions, now)
  const entries = CATEGORIES.map((category) => ({
    category,
    ms: summary.byCategory[category.id] ?? 0,
  }))
    .filter((entry) => entry.ms > 0)
    .sort((a, b) => b.ms - a.ms)

  if (entries.length === 0) return null

  return (
    <section className={styles.totals} aria-label="今日汇总">
      <h2 className={styles.totalsTitle}>今日汇总</h2>
      <ul className={styles.totalsList}>
        {entries.map(({ category, ms }) => (
          <li
            key={category.id}
            className={styles.totalRow}
            style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
          >
            <span className={styles.totalDot} aria-hidden="true" />
            <span className={styles.totalLabel}>{category.label}</span>
            <span className={styles.totalValue}>{formatHuman(ms)}</span>
          </li>
        ))}
      </ul>
      <div className={styles.totalsFoot}>
        <span>暂停共 {formatHuman(summary.pausedTotalMs)}</span>
        <span>总跨度 {formatHuman(summary.spanTotalMs)}</span>
      </div>
    </section>
  )
}
