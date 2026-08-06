import { useSyncExternalStore } from 'react'
import { getToastsSnapshot, subscribeToasts } from './toastStore'
import styles from './Toast.module.css'

export function ToastViewport() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, () => [])

  return (
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
  )
}
