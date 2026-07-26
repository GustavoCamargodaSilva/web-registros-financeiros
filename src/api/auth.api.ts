import type { AuthResponse, LoginRequest, RegistroRequest, Usuario } from '../types/auth.types'
import { apiRequest } from './client'

const BASE = '/api/v1/auth'

export const authApi = {
  registro: (data: RegistroRequest) =>
    apiRequest<void>(`${BASE}/registro`, {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false,
    }),

  login: (data: LoginRequest) =>
    apiRequest<AuthResponse>(`${BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false,
    }),

  refresh: () =>
    apiRequest<AuthResponse>(`${BASE}/refresh`, {
      method: 'POST',
      auth: false,
    }),

  logout: () =>
    apiRequest<void>(`${BASE}/logout`, {
      method: 'POST',
      auth: false,
    }),

  me: () => apiRequest<Usuario>(`${BASE}/me`),
}
