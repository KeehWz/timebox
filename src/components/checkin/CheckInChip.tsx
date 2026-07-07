import { checkInRepository } from '../../data/checkInRepository'
import { checkInElapsedMs } from '../../domain/checkIn'
import { formatDuration } from '../../domain/time'
import { useNow } from '../../hooks/useNow'
import { useOpenCheckIn } from '../../hooks/useOpenCheckIn'
import { useT } from '../../i18n/I18nContext'
import styles from './checkin.module.css'

/**
 * Slim persistent chip for the open check-in (spec §10 — background tracking, minimal UI).
 * Lives in the app shell so it stays visible on Home / Daily / Settings.
 */
export function CheckInChip() {
  const { t, locale } = useT()
  const checkIn = useOpenCheckIn()
  const now = useNow()
  if (!checkIn) return null

  return (
    <div className={styles.chip} role="status">
      <span className={styles.chipLabel}>
        {t('checkin.openLabel', { label: checkIn.label })} ·{' '}
        {formatDuration(checkInElapsedMs(checkIn, now), locale)}
      </span>
      <button
        type="button"
        className={styles.chipEnd}
        onClick={() => void checkInRepository.endOpen()}
      >
        {t('checkin.end')}
      </button>
    </div>
  )
}
