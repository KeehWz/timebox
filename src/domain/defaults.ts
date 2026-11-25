import type { DayState, SessionType, Settings } from './types'

export const DEFAULT_TYPES: SessionType[] = [
  { id: 'work', name: 'Work', description: 'Professional work, study, school, and projects', presets: ['Work', 'Study', 'Projects', 'Classes', 'Meetings', 'Reports'] },
  { id: 'exercise', name: 'Exercise', description: 'Physical activity and movement', presets: ['Gym', 'Running', 'Walking', 'Sports', 'Training'] },
  { id: 'leisure', name: 'Leisure', description: 'Recreation, entertainment, and hobbies', presets: ['Gaming', 'Movies', 'YouTube', 'Reading', 'Hobbies'] },
  { id: 'everyday', name: 'Everyday', description: 'Cooking, errands, daily life', presets: ['Cooking', 'Commuting', 'Groceries', 'Cleaning', 'Getting ready', 'Meals'] },
  { id: 'social', name: 'Social', description: 'Intentional time with other people', presets: ['Friends', 'Family', 'Conversation', 'Events', 'Calls'] },
]

export const MAX_SESSION_TYPES = 10

export const ICON_OPTIONS = [
  'study', 'work', 'exercise', 'leisure', 'rest', 'social', 'creative', 'everyday',
  'music', 'heart', 'laptop', 'camera', 'pencil', 'shopping', 'leaf', 'star', 'other',
]

export const ROUGH_AMOUNTS = ['no amount', '30m', '1h', '2h', '3h']

export const DEFAULT_DAY: DayState = { started: false, startTime: 0, endTime: 0 }

export const DEFAULT_SETTINGS: Settings = { nudgeAfter: '90', customNudgeMinutes: 90, shareUsage: true, usageNoticeSeen: false }

/** Presets for a category, falling back to the built-in list for the default categories. */
export function presetsFor(type: SessionType): string[] {
  return type.presets ?? DEFAULT_TYPES.find(item => item.id === type.id)?.presets ?? []
}
