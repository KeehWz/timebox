import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { EMOJI_SUGGESTIONS, validateFocusTypeInput } from '../../domain/focusType'
import { focusTypeRepository } from '../../data/focusTypeRepository'
import { useT } from '../../i18n/I18nContext'
import styles from './category-picker.module.css'

/** Keeps stored data-URLs small enough that Dexie rows and badge renders stay light. */
const MAX_IMAGE_BYTES = 300_000

interface CreateFocusTypeSheetProps {
  onClose: () => void
}

/**
 * Create a self-designed focus type: name it, then pick/type an emoji or upload a picture.
 * Stored in Dexie (focusTypes) and immediately available in the picker.
 */
export function CreateFocusTypeSheet({ onClose }: CreateFocusTypeSheetProps) {
  const { t } = useT()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string>(EMOJI_SUGGESTIONS[0])
  const [image, setImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const icon = image ?? emoji.trim()
  const valid = validateFocusTypeInput(name, icon)

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      setError(t('createType.imageTooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setError(null)
      setImage(String(reader.result))
    }
    reader.onerror = () => setError(t('createType.imageTooLarge'))
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    try {
      await focusTypeRepository.add(
        image
          ? { label: name, icon: image, iconKind: 'image' }
          : { label: name, icon: emoji.trim(), iconKind: 'emoji' },
      )
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <div className={styles.sheetBackdrop} role="presentation" onClick={onClose}>
      <form
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-type-heading"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="create-type-heading" className={styles.sheetTitle}>
          {t('createType.title')}
        </h2>

        <label className={styles.fieldLabel}>
          {t('createType.nameLabel')}
          <input
            className={styles.noteInput}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('createType.namePlaceholder')}
            autoFocus
          />
        </label>

        <fieldset className={styles.emojiField}>
          <legend className={styles.fieldLegend}>{t('createType.emojiLabel')}</legend>
          <div className={styles.emojiRow}>
            {EMOJI_SUGGESTIONS.map((suggestion) => {
              const selected = image === null && emoji === suggestion
              return (
                <button
                  key={suggestion}
                  type="button"
                  className={selected ? `${styles.emojiBtn} ${styles.emojiOn}` : styles.emojiBtn}
                  aria-pressed={selected}
                  onClick={() => {
                    setImage(null)
                    setEmoji(suggestion)
                  }}
                >
                  {suggestion}
                </button>
              )
            })}
          </div>
          <label className={styles.fieldLabel}>
            {t('createType.emojiCustom')}
            <input
              className={styles.noteInput}
              type="text"
              value={emoji}
              maxLength={8}
              onChange={(event) => {
                setImage(null)
                setEmoji(event.target.value)
              }}
            />
          </label>
        </fieldset>

        <label className={styles.fieldLabel}>
          {t('createType.imageLabel')}
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>
        {image && <img className={styles.sheetPreview} src={image} alt="" />}
        {error && (
          <p className={styles.sheetError} role="alert">
            {error}
          </p>
        )}

        <div className={styles.sheetActions}>
          <button type="submit" className={styles.startButton} disabled={!valid}>
            {t('createType.create')}
          </button>
          <button type="button" className={styles.back} onClick={onClose}>
            {t('createType.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
