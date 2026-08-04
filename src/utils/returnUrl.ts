const DEFAULT_RETURN_URL = '/home'

/**
 * Aceita apenas paths internos relativos (evita open redirect).
 */
export function getSafeReturnUrl(value: string | null | undefined, fallback = DEFAULT_RETURN_URL): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  return value
}

export function buildAuthPath(path: '/login' | '/registro', returnUrl: string): string {
  const params = new URLSearchParams({ returnUrl })
  return `${path}?${params.toString()}`
}
