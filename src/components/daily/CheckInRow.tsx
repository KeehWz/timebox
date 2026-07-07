import type { CheckIn } from '../../domain/checkIn'
import { checkInElapsedMs } from '../../domain/checkIn'
import { formatDuration, formatTimeOfDay } from '../../domain/time'
import { useT } from '../../i18n/I18nContext'
import styles from './daily.module.css'

interface CheckInRowProps {
  checkIn: CheckIn
  now: number
}

/** A check-in on the daily timeline (spec §15) — lighter than a session row. */
export function CheckInRow({ checkIn, now }: CheckInRowProps) {
  const { t, locale } = useT()
  const open = checkIn.status === 'open'

  return (
    <li className={styles.row}>
      <div className={styles.rowTime}>
        <span className={styles.time}>{formatTimeOfDay(checkIn.startedAt)}</span>
        <span className={styles.timeSep} aria-hidden="true">
          –
        </span>
        <span className={styles.time}>
          {open ? t('daily.ongoing') : formatTimeOfDay(checkIn.endedAt ?? checkIn.startedAt)}
        </span>
      </div>
      <div className={styles.rowMain}>
        <div className={styles.rowHead}>
          <span className={styles.checkInBadge}>
            <span aria-hidden="true">📍</span> {checkIn.label}
          </span>
        </div>
        <div className={styles.rowStats}>
          <span className={styles.focus}>
            {formatDuration(checkInElapsedMs(checkIn, now), locale)}
          </span>
        </div>
      </div>
    </li>
  )
}
