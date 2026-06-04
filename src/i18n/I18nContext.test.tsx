import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from './I18nProvider'
import { useT } from './I18nContext'

function Probe() {
  const { t, locale, setLocale } = useT()
  return (
    <div>
      <span data-testid="title">{t('home.title')}</span>
      <span data-testid="pause">{t('summary.pauseValue', { count: 3, total: '9m' })}</span>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale('en')}>switch</button>
    </div>
  )
}

describe('I18nProvider / useT', () => {
  it('provides zh strings (with interpolation) when initialLocale=zh', () => {
    render(
      <I18nProvider initialLocale="zh">
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByTestId('title')).toHaveTextContent('你想记录什么？')
    expect(screen.getByTestId('pause')).toHaveTextContent('3 次 · 共 9m')
  })

  it('switches to en reactively', async () => {
    render(
      <I18nProvider initialLocale="zh">
        <Probe />
      </I18nProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'switch' }))
    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    expect(screen.getByTestId('title')).toHaveTextContent('What are you tracking?')
    expect(screen.getByTestId('pause')).toHaveTextContent('3× · 9m total')
  })

  it('throws when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/I18nProvider/)
    spy.mockRestore()
  })
})
