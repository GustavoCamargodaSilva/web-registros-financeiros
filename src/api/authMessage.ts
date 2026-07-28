export const AUTH_MESSAGE_KEY = 'authMessage'

export function setAuthMessage(message: string) {
  sessionStorage.setItem(AUTH_MESSAGE_KEY, message)
}

export function consumeAuthMessage(): string | null {
  const message = sessionStorage.getItem(AUTH_MESSAGE_KEY)
  if (message) {
    sessionStorage.removeItem(AUTH_MESSAGE_KEY)
  }
  return message
}
