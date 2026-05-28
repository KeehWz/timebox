import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { getCategory } from '../../domain/categories'
import type { CategoryId } from '../../domain/session'
import styles from './category-picker.module.css'

interface NoteFormProps {
  categoryId: CategoryId
  onBack: () => void
  onStart: (note: string) => void
}

export function NoteForm({ categoryId, onBack, onStart }: NoteFormProps) {
  const [note, setNote] = useState('')
  const category = getCategory(categoryId)

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
        ‹ 重选
      </button>
      <form className={styles.noteForm} onSubmit={handleSubmit}>
        <label className={styles.noteLabel}>
          <span className={styles.noteCategory}>
            <span aria-hidden="true">{category.icon}</span> {category.label}
          </span>
          <input
            className={styles.noteInput}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={category.hint}
            autoFocus
            enterKeyHint="go"
            aria-label={`${category.label}的具体内容（可选）`}
          />
        </label>
        <button type="submit" className={styles.startButton}>
          开始 ↵
        </button>
      </form>
      <p className={styles.noteTip}>直接按 Enter 也能开始，内容可不填</p>
    </section>
  )
}
