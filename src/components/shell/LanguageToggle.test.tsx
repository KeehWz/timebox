import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithI18n } from '../../test/renderWithI18n'
import { LanguageToggle } from './LanguageToggle'

describe('LanguageToggle', () => {
  it('marks the active locale and switches on click', async () => {
    renderWithI18n(<LanguageToggle />, { locale: 'zh' })
    const zh = screen.getByRole('button', { name: '中' })
    const en = screen.getByRole('button', { name: 'EN' })
    expect(zh).toHaveAttribute('aria-pressed', 'true')
    expect(en).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(en)
    expect(en).toHaveAttribute('aria-pressed', 'true')
    expect(zh).toHaveAttribute('aria-pressed', 'false')
  })
})
