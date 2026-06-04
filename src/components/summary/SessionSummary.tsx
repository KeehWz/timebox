import type { Session } from '../../domain/session'
import {
  activeMs,
  longestPauseMs,
  pauseCount,
  totalPausedMs,
  totalSpanMs,
} from '../../domain/metrics'
import { formatDuration, formatTimeOfDay } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import { CategoryBadge } from '../ui/CategoryBadge'
import styles from './summary.module.css'

interface SessionSummaryProps {
  session: Session
}

export function SessionSummary({ session }: SessionSummaryProps) {
  const { t, locale } = useT()
  // Summaries are shown for completed sessions, so endedAt is set; fall back to startedAt
  // (a zero-duration view) rather than the live clock, keeping render pure & deterministic.
  const end = session.endedAt ?? session.startedAt
  const focus = activeMs(session, end)
  const span = totalSpanMs(session, end)
  const paused = totalPausedMs(session, end)
  const pauses = pauseCount(session)

  return (
    <section className={styles.summary}>
      <header className={styles.head}>
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
        <h1 className={styles.title}>{t('summary.title')}</h1>
      </header>

      <div className={styles.meta}>
        <CategoryBadge categoryId={session.categoryId} />
        {session.note && <p className={styles.note}>{session.note}</p>}
      </div>

      <p className={styles.focus}>
        <span className={styles.focusValue}>{formatDuration(focus, locale)}</span>
        <span className={styles.focusLabel}>{t('summary.focusLabel')}</span>
      </p>

      <dl className={styles.stats}>
        <div className={styles.row}>
          <dt>{t('summary.start')}</dt>
          <dd>{formatTimeOfDay(session.startedAt)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('summary.end')}</dt>
          <dd>{formatTimeOfDay(end)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('summary.span')}</dt>
          <dd>{formatDuration(span, locale)}</dd>
        </div>
        <div className={styles.row}>
          <dt>{t('summary.pauses')}</dt>
          <dd>{t('summary.pauseValue', { count: pauses, total: formatDuration(paused, locale) })}</dd>
        </div>
        {pauses > 0 && (
          <div className={styles.row}>
            <dt>{t('summary.longestPause')}</dt>
            <dd>{formatDuration(longestPauseMs(session, end), locale)}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
