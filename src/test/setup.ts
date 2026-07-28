import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { installMatchMediaMock, resetViewport } from './viewport'

installMatchMediaMock()

beforeEach(() => {
  resetViewport()
})
