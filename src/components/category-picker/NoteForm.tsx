import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { categoryAccent, isCategoryId } from '../../domain/categories'
import { useCategory } from '../../hooks/useCategory'
import { useT } from '../../i18n/I18nContext'
import styles from './category-picker.module.css'

interface NoteFormProps {
  /** Builtin CategoryId or a custom focus-type id. */
  categoryId: string
  onBack: () => void
  onStart: (note: string) => void
}

export function NoteForm({ categoryId, onBack, onStart }: NoteFormProps) {
  const { t } = useT()
  const [note, setNote] = useState('')
  const category = useCategory(categoryId)
  const label = category.displayLabel

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onStart(note)
  }

  return (
    <section
      className={styles.notePanel}
      style={{ '--accent': categoryAccent(category) } as CSSProperties}
    >
      <button type="button" className={styles.back} onClick={onBack}>
        ‹ {t('note.back')}
      </button>
      <form className={styles.noteForm} onSubmit={handleSubmit}>
        <label className={styles.noteLabel}>
          <span className={styles.noteCategory}>
            {category.iconImage ? (
              <img className={styles.tileImg} src={category.iconImage} alt="" />
            ) : (
              <span aria-hidden="true">{category.icon}</span>
            )}{' '}
            {label}
          </span>
          <input
            className={styles.noteInput}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isCategoryId(categoryId) ? t(`category.${categoryId}.hint`) : t('picker.customHint')
            }
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
