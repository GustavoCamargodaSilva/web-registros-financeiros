/**
 * Escala de breakpoints do projeto, espelhada no comentário de src/styles/tokens.css.
 *
 * Os valores são os mesmos já usados nas media queries existentes (640px e 900px),
 * para que CSS e JS concordem no mesmo pixel. A escala é desktop-first: cada
 * consulta é um `max-width`, logo `md` significa "900px ou menos".
 */
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 900,
  lg: 1200,
} as const

export type BreakpointName = keyof typeof BREAKPOINTS

/** Corte entre layout mobile (drawer, cards) e desktop (sidebar fixa, tabela). */
export const MOBILE_MAX_WIDTH = BREAKPOINTS.md

export const MEDIA = {
  /** Celular pequeno: <= 480px */
  xs: `(max-width: ${BREAKPOINTS.xs}px)`,
  /** Celular padrão: <= 640px */
  small: `(max-width: ${BREAKPOINTS.sm}px)`,
  /** Mobile e tablet retrato: <= 900px */
  mobile: `(max-width: ${BREAKPOINTS.md}px)`,
  /** Desktop: > 900px */
  desktop: `(min-width: ${BREAKPOINTS.md + 1}px)`,
} as const
