import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { type Locale, loadLocale, saveLocale } from './locale'
import { messages, type MessageKey } from './messages'
import { I18nContext, type I18nValue, type Params } from './I18nContext'

function translate(dict: Record<MessageKey, string>, key: MessageKey, params?: Params): string {
  const template = dict[key]
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocale] = useState<Locale>(() => initialLocale ?? loadLocale())

  useEffect(() => {
    document.documentElement.lang = locale
    saveLocale(locale)
  }, [locale])

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, t: (key, params) => translate(messages[locale], key, params) }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
