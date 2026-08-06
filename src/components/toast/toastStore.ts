export type ToastVariant = 'success' | 'error'

export interface ToastMessage {
  id: number
  message: string
  variant: ToastVariant
}

type Listener = () => void

let toasts: ToastMessage[] = []
const listeners = new Set<Listener>()
let nextId = 0

function emit() {
  listeners.forEach((listener) => listener())
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToastsSnapshot() {
  return toasts
}

export function pushToast(message: string, variant: ToastVariant) {
  const duplicated = toasts.some((toast) => toast.message === message && toast.variant === variant)
  if (duplicated) {
    return
  }

  const id = ++nextId
  toasts = [...toasts, { id, message, variant }]
  emit()

  window.setTimeout(() => removeToast(id), 4000)
}

export function removeToast(id: number) {
  const next = toasts.filter((toast) => toast.id !== id)
  if (next.length === toasts.length) {
    return
  }
  toasts = next
  emit()
}

/** Apenas para testes. */
export function resetToastStore() {
  toasts = []
  nextId = 0
  emit()
}
