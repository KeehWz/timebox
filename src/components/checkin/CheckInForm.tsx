import { useState } from 'react'
import type { FormEvent } from 'react'
import { useT } from '../../i18n/I18nContext'
import styles from './checkin.module.css'

interface CheckInFormProps {
  onStart: (label: string) => void
  onCancel: () => void
}

/** Minimal label entry for a check-in (spec §10): type "Lunch", press Enter, done. */
export function CheckInForm({ onStart, onCancel }: CheckInFormProps) {
  const { t } = useT()
  const [label, setLabel] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (label.trim() === '') return
    onStart(label)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.formLabel}>
        {t('checkin.title')}
        <input
          className={styles.formInput}
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('checkin.placeholder')}
          autoFocus
          enterKeyHint="go"
        />
      </label>
      <div className={styles.formActions}>
        <button type="submit" className={styles.formStart} disabled={label.trim() === ''}>
          {t('checkin.start')}
        </button>
        <button type="button" className={styles.formCancel} onClick={onCancel}>
          {t('checkin.cancel')}
        </button>
      </div>
    </form>
  )
}
