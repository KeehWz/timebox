import { db } from './db'
import type { FocusType } from '../domain/focusType'
import { pickFocusTypeColor, validateFocusTypeInput } from '../domain/focusType'
import { newId } from '../lib/id'

export interface FocusTypeInput {
  label: string
  icon: string
  iconKind: 'emoji' | 'image'
}

/** User-created focus types (custom categories). */
export const focusTypeRepository = {
  /** Create and persist a custom focus type; accent color rotates through the palette. */
  async add(input: FocusTypeInput): Promise<FocusType> {
    if (!validateFocusTypeInput(input.label, input.icon)) {
      throw new Error('A focus type needs a name and an emoji or picture')
    }
    return db.transaction('rw', db.focusTypes, async () => {
      const existing = await db.focusTypes.count()
      const focusType: FocusType = {
        id: `ft-${newId()}`,
        label: input.label.trim(),
        icon: input.icon,
        iconKind: input.iconKind,
        color: pickFocusTypeColor(existing),
        createdAt: Date.now(),
      }
      await db.focusTypes.add(focusType)
      return focusType
    })
  },

  list(): Promise<FocusType[]> {
    return db.focusTypes.orderBy('createdAt').toArray()
  },

  remove(id: string): Promise<void> {
    return db.focusTypes.delete(id)
  },
}
