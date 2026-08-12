import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { ScreenHeader } from './ScreenHeader'

describe('ScreenHeader', () => {
  it('renders the serif title and short date', () => {
    renderWithI18n(<ScreenHeader title="专注" />, { withRouter: true })
    expect(screen.getByRole('heading', { name: '专注' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows the settings gear when requested', () => {
    renderWithI18n(<ScreenHeader title="专注" showSettings />, { withRouter: true })
    const gear = screen.getByRole('link', { name: '设置' })
    expect(gear).toHaveAttribute('href', '/settings')
  })
})
