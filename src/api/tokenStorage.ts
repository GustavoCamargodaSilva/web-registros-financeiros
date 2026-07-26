const ACCESS_TOKEN_KEY = 'accessToken'

export const tokenStorage = {
  get(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY)
  },
  set(token: string) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token)
  },
  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  },
}

let memoryToken: string | null = tokenStorage.get()

export function getAccessToken(): string | null {
  return memoryToken
}

export function setAccessToken(token: string | null) {
  memoryToken = token
  if (token) {
    tokenStorage.set(token)
  } else {
    tokenStorage.clear()
  }
}
