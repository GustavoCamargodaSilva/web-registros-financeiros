import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { pushToast } from './toastStore'

interface ToastContextValue {
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      showSuccess: (message: string) => pushToast(message, 'success'),
      showError: (message: string) => pushToast(message, 'error'),
    }),
    [],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}
