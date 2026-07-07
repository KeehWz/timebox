import { orderCategories } from '../../domain/categoryStats'
import type { CategoryId } from '../../domain/session'
import { categoryStatsRepository } from '../../data/categoryStatsRepository'
import { useCategoryStats } from '../../hooks/useCategoryStats'
import { useT } from '../../i18n/I18nContext'
import { CategoryTile } from './CategoryTile'
import styles from './category-picker.module.css'

interface CategoryPickerProps {
  onSelect: (id: CategoryId) => void
}

/**
 * Category grid, ordered favorites-first then by recency (spec §7). Each tile carries a
 * favorite toggle as a SIBLING button (buttons must not nest) overlaid on the card corner.
 */
export function CategoryPicker({ onSelect }: CategoryPickerProps) {
  const { t } = useT()
  const stats = useCategoryStats()
  const categories = orderCategories(stats ?? [])
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
          const label = t(`category.${category.id}.label`)
          const favorite = favoriteIds.has(category.id)
          return (
            <li key={category.id} className={styles.gridItem}>
              <CategoryTile category={category} onSelect={onSelect} />
              <button
                type="button"
                className={favorite ? `${styles.favBtn} ${styles.favOn}` : styles.favBtn}
                aria-pressed={favorite}
                aria-label={t(favorite ? 'picker.unfavoriteAria' : 'picker.favoriteAria', {
                  category: label,
                })}
                onClick={() => void categoryStatsRepository.toggleFavorite(category.id)}
              >
                {favorite ? '★' : '☆'}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
