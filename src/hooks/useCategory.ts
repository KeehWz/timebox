import { useCategoryResolver, type ResolvedCategory } from './useCategoryResolver'

/**
 * Resolve one category id (builtin or custom focus type) to its display shape, live.
 * Falls back to neutral 'other' visuals while custom types are still loading.
 */
export function useCategory(id: string): ResolvedCategory {
  return useCategoryResolver()(id)
}
