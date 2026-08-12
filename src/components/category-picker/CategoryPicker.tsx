import { useState } from 'react'
import { orderCategories } from '../../domain/categoryStats'
import { isCategoryId } from '../../domain/categories'
import { toCategory } from '../../domain/focusType'
import { categoryStatsRepository } from '../../data/categoryStatsRepository'
import { useCategoryStats } from '../../hooks/useCategoryStats'
import { useFocusTypes } from '../../hooks/useFocusTypes'
import { useT } from '../../i18n/I18nContext'
import { CategoryTile } from './CategoryTile'
import { CreateFocusTypeSheet } from './CreateFocusTypeSheet'
import styles from './category-picker.module.css'

interface CategoryPickerProps {
  onSelect: (id: string) => void
}

/**
 * Category grid, ordered favorites-first then by recency (spec §7), now including
 * user-created focus types plus a "new type" tile (design: custom focus). Each tile
 * carries a favorite toggle as a SIBLING button (buttons must not nest).
 */
export function CategoryPicker({ onSelect }: CategoryPickerProps) {
  const { t } = useT()
  const stats = useCategoryStats()
  const focusTypes = useFocusTypes()
  const [creating, setCreating] = useState(false)
  const customs = (focusTypes ?? []).map(toCategory)
  const categories = orderCategories(stats ?? [], customs)
  const favoriteIds = new Set((stats ?? []).filter((s) => s.favorite).map((s) => s.id))

  return (
    <section className={styles.picker} aria-labelledby="picker-heading">
      <header className={styles.intro}>
        <h1 id="picker-heading" className={styles.heading}>
          {t('home.title')}
        </h1>
        <p className={styles.sub}>{t('home.subtitle')}</p>
      </header>
      <ul className={styles.grid}>
        {categories.map((category) => {
          const id = category.id
          const label = category.label ?? (isCategoryId(id) ? t(`category.${id}.label`) : id)
          const favorite = favoriteIds.has(id)
          return (
            <li key={id} className={styles.gridItem}>
              <CategoryTile category={category} onSelect={onSelect} />
              <button
                type="button"
                className={favorite ? `${styles.favBtn} ${styles.favOn}` : styles.favBtn}
                aria-pressed={favorite}
                aria-label={t(favorite ? 'picker.unfavoriteAria' : 'picker.favoriteAria', {
                  category: label,
                })}
                onClick={() => void categoryStatsRepository.toggleFavorite(id)}
              >
                {favorite ? '★' : '☆'}
              </button>
            </li>
          )
        })}
        <li className={styles.gridItem}>
          <button type="button" className={styles.newTile} onClick={() => setCreating(true)}>
            <span className={styles.tileIcon} aria-hidden="true">
              ＋
            </span>
            <span className={styles.tileLabel}>{t('picker.newType')}</span>
            <span className={styles.tileHint}>{t('picker.newTypeHint')}</span>
          </button>
        </li>
      </ul>
      {creating && <CreateFocusTypeSheet onClose={() => setCreating(false)} />}
    </section>
  )
}
