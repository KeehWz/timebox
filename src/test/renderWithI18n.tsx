import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import type { Locale } from '../i18n/locale'

interface RenderOptions {
  locale?: Locale
  route?: string
  withRouter?: boolean
}

/**
 * Render a component inside the i18n provider (default locale 'zh', so existing Chinese
 * assertions stay valid). Pass `withRouter` for components that use react-router hooks/links.
 */
export function renderWithI18n(ui: ReactElement, options: RenderOptions = {}) {
  const { locale = 'zh', route = '/', withRouter = false } = options
  const wrapper = ({ children }: { children: ReactNode }) =>
    withRouter ? (
      <I18nProvider initialLocale={locale}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </I18nProvider>
    ) : (
      <I18nProvider initialLocale={locale}>{children}</I18nProvider>
    )
  return render(ui, { wrapper })
}
