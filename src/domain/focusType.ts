import type { Category } from './categories'

/**
 * A user-created focus type (custom category). Builtin categories live in domain/categories.ts;
 * custom ones are stored in Dexie and merged into the picker/badges at runtime.
 */
export interface FocusType {
  id: string
  label: string
  /** Emoji glyph when iconKind = 'emoji'; data-URL image when iconKind = 'image'. */
  icon: string
  iconKind: 'emoji' | 'image'
  /** CSS color literal for this type's accent (assigned from FOCUS_TYPE_COLORS on create). */
  color: string
  createdAt: number
}

/** Accent rotation for new custom types — warm-palette companions to the built-in accents. */
export const FOCUS_TYPE_COLORS = [
  'oklch(58% 0.14 45)', // terracotta
  'oklch(56% 0.12 260)', // indigo
  'oklch(60% 0.11 160)', // moss
  'oklch(60% 0.13 340)', // plum
  'oklch(64% 0.12 85)', // ochre
  'oklch(58% 0.1 220)', // slate blue
] as const

export function pickFocusTypeColor(existingCount: number): string {
  return FOCUS_TYPE_COLORS[existingCount % FOCUS_TYPE_COLORS.length]
}

/** Quick-pick emoji suggestions shown in the create sheet. */
export const EMOJI_SUGGESTIONS = ['🎯', '🎨', '🎸', '🧘', '💻', '📝', '🌱', '🍳', '🎮', '🚴', '🧪', '🌙'] as const

/** Project a stored focus type into the shared Category shape used by picker/badges. */
export function toCategory(focusType: FocusType): Category {
  return {
    id: focusType.id,
    icon: focusType.iconKind === 'emoji' ? focusType.icon : '',
    iconImage: focusType.iconKind === 'image' ? focusType.icon : undefined,
    color: focusType.color,
    label: focusType.label,
  }
}

/** Validate creation input: a non-empty name plus either an emoji or an uploaded image. */
export function validateFocusTypeInput(label: string, icon: string): boolean {
  return label.trim().length > 0 && icon.length > 0
}
