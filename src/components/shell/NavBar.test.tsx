import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../../test/renderWithI18n'
import { NavBar } from './NavBar'

describe('NavBar', () => {
  it('renders the Track and Today links (zh labels)', () => {
    renderWithI18n(<NavBar />, { withRouter: true, route: '/' })
    expect(screen.getByRole('link', { name: /记录/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /今天/ })).toBeInTheDocument()
  })

  it('marks the active route with aria-current', () => {
    renderWithI18n(<NavBar />, { withRouter: true, route: '/day' })
    expect(screen.getByRole('link', { name: /今天/ })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: /记录/ })).not.toHaveAttribute('aria-current')
  })
})
