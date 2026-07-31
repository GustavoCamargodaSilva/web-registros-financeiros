import { useState, type InputHTMLAttributes } from 'react'
import inputStyles from './Input.module.css'
import styles from './PasswordInput.module.css'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
}

function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-2.2 3.1M6.1 6.1A18.2 18.2 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PasswordInput({
  label,
  error,
  hint,
  id,
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? props.name

  return (
    <div className={inputStyles.field}>
      {label ? (
        <label htmlFor={inputId} className={inputStyles.label}>
          {label}
        </label>
      ) : null}
      <div className={styles.control}>
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={[
            inputStyles.input,
            styles.inputWithToggle,
            error ? inputStyles.inputError : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          aria-invalid={Boolean(error)}
          {...props}
        />
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
      {error ? <span className={inputStyles.error}>{error}</span> : null}
      {!error && hint ? <span className={inputStyles.hint}>{hint}</span> : null}
    </div>
  )
}
