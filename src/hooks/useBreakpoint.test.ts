import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setViewportWidth } from '../test/viewport'
import { useBreakpoint } from './useBreakpoint'

describe('useBreakpoint', () => {
  it('identifica desktop acima de 900px', () => {
    setViewportWidth(1280)

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toEqual({ isMobile: false, isSmall: false, isDesktop: true })
  })

  it('identifica tablet retrato em 900px', () => {
    setViewportWidth(900)

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toEqual({ isMobile: true, isSmall: false, isDesktop: false })
  })

  it('identifica celular em 360px', () => {
    setViewportWidth(360)

    const { result } = renderHook(() => useBreakpoint())

    expect(result.current).toEqual({ isMobile: true, isSmall: true, isDesktop: false })
  })

  it('alterna ao redimensionar de desktop para celular', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current.isDesktop).toBe(true)

    act(() => {
      setViewportWidth(375)
    })

    expect(result.current.isMobile).toBe(true)
    expect(result.current.isSmall).toBe(true)
  })
})
