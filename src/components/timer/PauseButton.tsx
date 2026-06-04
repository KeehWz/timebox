import type { Session } from '../../domain/session'
import { sessionRepository } from '../../data/sessionRepository'
import { useT } from '../../i18n/I18nContext'
import styles from './timer.module.css'

interface PauseButtonProps {
  session: Session
}

export function PauseButton({ session }: PauseButtonProps) {
  const { t } = useT()
  const paused = session.status === 'paused'

  function toggle() {
    if (paused) void sessionRepository.resume(session.id)
    else void sessionRepository.pause(session.id)
  }

  return (
    <button type="button" className={styles.pauseButton} onClick={toggle}>
      {paused ? t('timer.resume') : t('timer.pause')}
    </button>
  )
}
