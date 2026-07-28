/** Preferência escolhida pelo usuário. `system` acompanha o sistema operacional. */
export type ThemeMode = 'light' | 'dark' | 'system'

/** Tema efetivamente aplicado no documento. */
export type ResolvedTheme = 'light' | 'dark'

/**
 * Chave no localStorage. Duplicada no script anti-FOUC do index.html, que roda
 * antes do bundle e por isso não pode importar deste módulo — ao mudar aqui,
 * mudar lá também.
 */
export const THEME_STORAGE_KEY = 'theme'

export const THEME_ATTRIBUTE = 'data-theme'

export const DEFAULT_THEME_MODE: ThemeMode = 'system'

export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)'

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}
