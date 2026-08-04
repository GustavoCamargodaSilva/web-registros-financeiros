import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'primary' | 'danger' | 'outline' | 'success' | 'ghost'
type ButtonSize = 'default' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Exibe spinner e desabilita o botão enquanto a ação assíncrona roda. */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    size === 'icon' ? styles.icon : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
