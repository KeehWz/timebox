import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest runs with globals disabled, so register Testing Library's DOM cleanup explicitly.
afterEach(() => {
  cleanup()
})
