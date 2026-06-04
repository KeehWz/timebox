import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useLongPress } from '../../hooks/useLongPress'
import { useT } from '../../i18n/I18nContext'
import { ProgressRing } from './ProgressRing'
import styles from './timer.module.css'

interface LongPressEndButtonProps {
  onEnd: () => void
}

export function LongPressEndButton({ onEnd }: LongPressEndButtonProps) {
  const { t } = useT()
  const { progress, handlers } = useLongPress(onEnd)
  const usedPointerRef = useRef(false)

  function handlePointerDown(e: ReactPointerEvent) {
    usedPointerRef.current = true
    handlers.onPointerDown(e)
  }

  function handleClick() {
    // Pointer users end via the hold gesture — suppress the fallback right after a pointer press.
    if (usedPointerRef.current) {
      usedPointerRef.current = false
      return
    }
    // Keyboard / assistive-tech activation has no hold, so confirm before ending.
    if (window.confirm(t('timer.endConfirm'))) onEnd()
  }

  return (
    <div className={styles.endWrap}>
      <button
        type="button"
        className={styles.endButton}
        aria-label={t('timer.endAria')}
        onClick={handleClick}
        {...handlers}
        onPointerDown={handlePointerDown}
      >
        <ProgressRing progress={progress} />
        <span className={styles.endLabel}>{t('timer.endLabel')}</span>
      </button>
    </div>
  )
}
