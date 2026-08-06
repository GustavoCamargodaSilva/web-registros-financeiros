import styles from './RouteFallback.module.css'

export function RouteFallback() {
  return (
    <div className={styles.wrap} aria-busy="true" aria-label="Carregando página">
      <p className={styles.label} role="status">
        Carregando…
      </p>
    </div>
  )
}
