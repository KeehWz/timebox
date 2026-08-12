import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { categoryAccent } from '../../domain/categories'
import { useCategory } from '../../hooks/useCategory'
import { useT } from '../../i18n/I18nContext'
import styles from './start.module.css'

interface StartTransitionProps {
  /** Builtin CategoryId or a custom focus-type id. */
  categoryId: string
  /** First session of the day gets a longer beat (spec §6: 2–4 s vs 1–2 s). */
  firstOfDay: boolean
  /** Drift start (spec §9): neutral accent + drift label instead of the category. */
  drift?: boolean
  /** Fired exactly once — after the timeout, or immediately on tap-to-skip. */
  onDone: () => void
}

export const FIRST_OF_DAY_MS = 2600
export const NORMAL_MS = 1400
export const REDUCED_MOTION_MS = 300

function transitionDuration(firstOfDay: boolean): number {
  // jsdom has no matchMedia; treat "unknown" as full motion.
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return REDUCED_MOTION_MS
  return firstOfDay ? FIRST_OF_DAY_MS : NORMAL_MS
}

/**
 * Short category-colored breath between picking a category and the running timer (spec §6).
 * The session starts when this finishes, so the transition never eats into focus time.
 * The whole surface is a button: tap anywhere to skip.
 */
export function StartTransition({ categoryId, firstOfDay, drift = false, onDone }: StartTransitionProps) {
  const { t } = useT()
  const category = useCategory(categoryId)
  const firedRef = useRef(false)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (firedRef.current) return
      firedRef.current = true
      onDoneRef.current()
    }, transitionDuration(firstOfDay))
    return () => window.clearTimeout(id)
  }, [firstOfDay])

  function skip() {
    if (firedRef.current) return
    firedRef.current = true
    onDone()
  }

  return (
    <button
      type="button"
      className={styles.transition}
      style={{ '--accent': drift ? 'var(--cat-other)' : categoryAccent(category) } as CSSProperties}
      onClick={skip}
      aria-label={t('transition.skipAria')}
    >
      <span className={styles.transitionPulse} aria-hidden="true" />
      <span className={styles.transitionIcon} aria-hidden="true">
        {drift ? '🌫️' : category.iconImage ? (
          <img className={styles.transitionImg} src={category.iconImage} alt="" />
        ) : (
          category.icon
        )}
      </span>
      <span className={styles.transitionLabel}>
        {drift ? t('drift.label') : category.displayLabel}
      </span>
      <span className={styles.transitionHint}>{t('transition.preparing')}</span>
    </button>
  )
}
