import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { getCategory } from '../../domain/categories'
import type { CategoryId } from '../../domain/session'
import { useT } from '../../i18n/I18nContext'
import styles from './category-picker.module.css'

interface NoteFormProps {
  categoryId: CategoryId
  onBack: () => void
  onStart: (note: string) => void
}

export function NoteForm({ categoryId, onBack, onStart }: NoteFormProps) {
  const { t } = useT()
  const [note, setNote] = useState('')
  const category = getCategory(categoryId)
  const label = t(`category.${categoryId}.label`)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onStart(note)
  }

  return (
    <section
      className={styles.notePanel}
      style={{ '--accent': `var(${category.colorVar})` } as CSSProperties}
    >
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ {t('note.back')}
      </button>
      <form className={styles.noteForm} onSubmit={handleSubmit}>
        <label className={styles.noteLabel}>
          <span className={styles.noteCategory}>
            <span aria-hidden="true">{category.icon}</span> {label}
          </span>
          <input
            className={styles.noteInput}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t(`category.${categoryId}.hint`)}
            autoFocus
            enterKeyHint="go"
            aria-label={t('note.placeholderAria', { category: label })}
          />
        </label>
        <button type="submit" className={styles.startButton}>
          {t('note.start')} ↵
        </button>
      </form>
      <p className={styles.noteTip}>{t('note.tip')}</p>
    </section>
  )
}
