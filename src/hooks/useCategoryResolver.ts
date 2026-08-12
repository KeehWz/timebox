import { useCallback } from 'react'
import { getCategory, isCategoryId, type Category } from '../domain/categories'
import { toCategory } from '../domain/focusType'
import { useT } from '../i18n/I18nContext'
import { useFocusTypes } from './useFocusTypes'

export interface ResolvedCategory extends Category {
  /** Localized builtin label, or the custom type's own name. */
  displayLabel: string
}

/**
 * Live resolver from a category id (builtin or custom focus type) to its display shape.
 * Centralizes icon/accent/label lookup so screens never special-case custom types.
 */
export function useCategoryResolver(): (id: string) => ResolvedCategory {
  const { t } = useT()
  const focusTypes = useFocusTypes()
  return useCallback(
    (id: string) => {
      const custom = focusTypes?.find((focusType) => focusType.id === id)
      if (custom) return { ...toCategory(custom), displayLabel: custom.label }
      const builtin = getCategory(id)
      const labelId = isCategoryId(id) ? id : 'other'
      return { ...builtin, displayLabel: t(`category.${labelId}.label`) }
    },
    [focusTypes, t],
  )
}
