import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import styles from './Toast.module.css'

type ToastVariant = 'success' | 'error'

interface ToastMessage {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showSuccess: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const nextIdRef = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant) => {
      setToasts((current) => {
        const duplicated = current.some(
          (toast) => toast.message === message && toast.variant === variant,
        )
        if (duplicated) {
          return current
        }
        const id = ++nextIdRef.current
        window.setTimeout(() => removeToast(id), 4000)
        return [...current, { id, message, variant }]
      })
    },
    [removeToast],
  )

  const showSuccess = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast],
  )

  const showError = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast],
  )

  const value = useMemo(
    () => ({
      showSuccess,
      showError,
    }),
    [showSuccess, showError],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.variant]}`}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}
