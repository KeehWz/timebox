import { createContext, useContext } from 'react'
import type { Locale } from './locale'
import type { MessageKey } from './messages'

export type Params = Record<string, string | number>

export interface I18nValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, params?: Params) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function useT(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used within <I18nProvider>')
  return ctx
}
