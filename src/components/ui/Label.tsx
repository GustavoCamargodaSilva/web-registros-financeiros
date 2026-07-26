import type { LabelHTMLAttributes, ReactNode } from 'react'
import styles from './Label.module.css'

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  error?: string
  children: ReactNode
}

export function Label({ error, children, ...props }: LabelProps) {
  return (
    <label {...props}>
      <span className={styles.label}>{children}</span>
      {error ? <span className={styles.error}>{error}</span> : null}
    </label>
  )
}
