import type { Session } from '../../domain/session'
import {
  activeMs,
  longestPauseMs,
  pauseCount,
  totalPausedMs,
  totalSpanMs,
} from '../../domain/metrics'
import { formatHuman, formatTimeOfDay } from '../../domain/time'
import { CategoryBadge } from '../ui/CategoryBadge'
import styles from './summary.module.css'

interface SessionSummaryProps {
  session: Session
}

export function SessionSummary({ session }: SessionSummaryProps) {
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
        <h1 className={styles.title}>已记录</h1>
      </header>

      <div className={styles.meta}>
        <CategoryBadge categoryId={session.categoryId} />
        {session.note && <p className={styles.note}>{session.note}</p>}
      </div>

      <p className={styles.focus}>
        <span className={styles.focusValue}>{formatHuman(focus)}</span>
        <span className={styles.focusLabel}>专注时长</span>
      </p>

      <dl className={styles.stats}>
        <div className={styles.row}>
          <dt>开始</dt>
          <dd>{formatTimeOfDay(session.startedAt)}</dd>
        </div>
        <div className={styles.row}>
          <dt>结束</dt>
          <dd>{formatTimeOfDay(end)}</dd>
        </div>
        <div className={styles.row}>
          <dt>总跨度</dt>
          <dd>{formatHuman(span)}</dd>
        </div>
        <div className={styles.row}>
          <dt>快速暂停</dt>
          <dd>
            {pauses} 次 · 共 {formatHuman(paused)}
          </dd>
        </div>
        {pauses > 0 && (
          <div className={styles.row}>
            <dt>最长暂停</dt>
            <dd>{formatHuman(longestPauseMs(session, end))}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
