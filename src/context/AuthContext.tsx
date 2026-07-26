import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ambienteStorage } from '../api/ambienteStorage'
import { authApi } from '../api/auth.api'
import { ApiError } from '../api/client'
import { getAccessToken, setAccessToken } from '../api/tokenStorage'
import type { LoginRequest, RegistroRequest, Usuario } from '../types/auth.types'

interface AuthContextValue {
  usuario: Usuario | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  registro: (data: RegistroRequest) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUsuario(null)
      setIsLoading(false)
      return
    }

    try {
      setUsuario(await authApi.me())
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setAccessToken(null)
      }
      setUsuario(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data)
    setAccessToken(response.accessToken)
    setUsuario(await authApi.me())
  }, [])

  const registro = useCallback(async (data: RegistroRequest) => {
    await authApi.registro(data)
    await login({ login: data.email, senha: data.senha })
  }, [login])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setAccessToken(null)
      ambienteStorage.clear()
      setUsuario(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      isAuthenticated: Boolean(usuario),
      isLoading,
      login,
      registro,
      logout,
    }),
    [usuario, isLoading, login, registro, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
