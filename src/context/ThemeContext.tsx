import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { themeStorage } from '../api/themeStorage'
import {
  DEFAULT_THEME_MODE,
  PREFERS_DARK_QUERY,
  THEME_ATTRIBUTE,
  type ResolvedTheme,
  type ThemeMode,
} from '../constants/theme'

interface ThemeContextValue {
  /** Preferência salva: `light`, `dark` ou `system`. */
  mode: ThemeMode
  /** Tema aplicado no documento depois de resolver `system`. */
  resolvedTheme: ResolvedTheme
  setMode: (mode: ThemeMode) => void
  /** Alterna entre claro e escuro, saindo do modo `system`. */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function prefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(PREFERS_DARK_QUERY).matches
}

function resolveTheme(mode: ThemeMode, systemDark: boolean): ResolvedTheme {
  if (mode === 'system') {
    return systemDark ? 'dark' : 'light'
  }
  return mode
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => themeStorage.get() ?? DEFAULT_THEME_MODE)
  const [systemDark, setSystemDark] = useState(prefersDark)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const query = window.matchMedia(PREFERS_DARK_QUERY)
    const handleChange = () => setSystemDark(query.matches)

    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = resolveTheme(mode, systemDark)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute(THEME_ATTRIBUTE, resolvedTheme)

    // Barra de status do navegador mobile acompanha o header da aplicação
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const brand = getComputedStyle(root).getPropertyValue('--color-brand').trim()
      if (brand) {
        meta.setAttribute('content', brand)
      }
    }
  }, [resolvedTheme])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    themeStorage.set(next)
  }, [])

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = resolvedTheme === 'dark' ? 'light' : 'dark'
    setModeState(next)
    themeStorage.set(next)
  }, [resolvedTheme])

  const value = useMemo(
    () => ({ mode, resolvedTheme, setMode, toggleTheme }),
    [mode, resolvedTheme, setMode, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  }
  return context
}
