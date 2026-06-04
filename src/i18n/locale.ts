export type Locale = 'zh' | 'en'

export const LOCALES: readonly Locale[] = ['zh', 'en']

const STORAGE_KEY = 'timebox.locale'

export function isLocale(value: unknown): value is Locale {
  return value === 'zh' || value === 'en'
}

/** First-run guess from the browser; everything Chinese-tagged → zh, otherwise en. */
export function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('zh')) {
    return 'zh'
  }
  return 'en'
}

/** Stored choice wins; otherwise detect. Tolerant of unavailable storage (private mode). */
export function loadLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // localStorage unavailable — fall through to detection
  }
  return detectLocale()
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // ignore persistence failures
  }
}
