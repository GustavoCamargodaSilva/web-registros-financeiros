import { ambienteStorage } from './ambienteStorage'
import { setAccessToken, getAccessToken } from './tokenStorage'

export class ApiError extends Error {
  status: number
  body: Record<string, string>

  constructor(status: number, body: Record<string, string>) {
    super(body.mensagem ?? 'Erro na requisição')
    this.status = status
    this.body = body
  }
}

interface ApiRequestOptions extends RequestInit {
  auth?: boolean
  retry?: boolean
}

async function parseErrorBody(response: Response): Promise<Record<string, string>> {
  try {
    return (await response.json()) as Record<string, string>
  } catch {
    return { mensagem: response.statusText }
  }
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      return false
    }

    const data = (await response.json()) as { accessToken: string }
    setAccessToken(data.accessToken)
    return true
  } catch {
    return false
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const useAuth = options.auth !== false
  const headers: HeadersInit = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  }

  const token = getAccessToken()
  if (useAuth && token) {
    ;(headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  const ambienteId = ambienteStorage.get()
  if (useAuth && ambienteId != null) {
    ;(headers as Record<string, string>)['X-Ambiente-Id'] = String(ambienteId)
  }

  let response: Response

  try {
    response = await fetch(path, {
      ...options,
      headers,
      credentials: 'include',
    })
  } catch {
    throw new ApiError(0, {
      mensagem: 'API indisponível. Verifique se o backend está em localhost:8090',
    })
  }

  if (response.status === 401 && useAuth && !options.retry) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retry: true })
    }
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    const body = await parseErrorBody(response)
    throw new ApiError(response.status, body)
  }

  if (response.headers.get('content-length') === '0') {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}
