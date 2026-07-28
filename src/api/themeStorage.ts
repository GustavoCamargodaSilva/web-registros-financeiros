import { isThemeMode, THEME_STORAGE_KEY, type ThemeMode } from '../constants/theme'

/**
 * Diferente de tokenStorage e ambienteStorage, que usam sessionStorage, o tema
 * vai para o localStorage: é uma preferência de conforto visual e precisa
 * sobreviver ao fechamento do navegador, não um dado de sessão.
 *
 * Os acessos são protegidos porque o modo privado de alguns navegadores lança
 * exceção ao ler ou gravar no localStorage.
 */
export const themeStorage = {
  get(): ThemeMode | null {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY)
      return isThemeMode(raw) ? raw : null
    } catch {
      return null
    }
  },
  set(mode: ThemeMode) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      // Sem persistência: o tema ainda vale para a sessão atual
    }
  },
  clear() {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY)
    } catch {
      // Nada a fazer se o storage estiver indisponível
    }
  },
}
