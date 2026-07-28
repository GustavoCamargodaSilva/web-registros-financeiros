import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setViewportWidth } from '../test/viewport'
import { useMediaQuery } from './useMediaQuery'

describe('useMediaQuery', () => {
  it('já na primeira renderização reflete a largura atual', () => {
    setViewportWidth(360)

    const { result } = renderHook(() => useMediaQuery('(max-width: 900px)'))

    expect(result.current).toBe(true)
  })

  it('retorna false quando a consulta não corresponde', () => {
    setViewportWidth(1280)

    const { result } = renderHook(() => useMediaQuery('(max-width: 900px)'))

    expect(result.current).toBe(false)
  })

  it('reage à mudança de largura', () => {
    setViewportWidth(1280)
    const { result } = renderHook(() => useMediaQuery('(max-width: 900px)'))
    expect(result.current).toBe(false)

    act(() => {
      setViewportWidth(360)
    })

    expect(result.current).toBe(true)
  })

  it('avalia consultas de min-width', () => {
    setViewportWidth(1280)

    const { result } = renderHook(() => useMediaQuery('(min-width: 901px)'))

    expect(result.current).toBe(true)
  })
})
