import { MEDIA } from '../constants/breakpoints'
import { useMediaQuery } from './useMediaQuery'

export interface BreakpointState {
  /** <= 900px — sidebar vira drawer, tabela vira cards. */
  isMobile: boolean
  /** <= 640px — celular padrão. */
  isSmall: boolean
  /** > 900px */
  isDesktop: boolean
}

export function useBreakpoint(): BreakpointState {
  const isMobile = useMediaQuery(MEDIA.mobile)
  const isSmall = useMediaQuery(MEDIA.small)

  return { isMobile, isSmall, isDesktop: !isMobile }
}
