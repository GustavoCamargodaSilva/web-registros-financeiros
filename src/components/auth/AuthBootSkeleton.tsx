import styles from './AuthBootSkeleton.module.css'

/** Placeholder estruturado do AppShell enquanto `auth.me` resolve no boot. */
export function AuthBootSkeleton() {
  return (
    <div className={styles.shell} aria-busy="true" aria-label="Carregando sessão">
      <div className={styles.header}>
        <span className={`skeleton ${styles.headerMark}`} />
        <span className={`skeleton ${styles.headerChip}`} />
      </div>
      <aside className={styles.sidebar} aria-hidden="true">
        <span className={`skeleton ${styles.navItem}`} />
        <span className={`skeleton ${styles.navItem}`} />
        <span className={`skeleton ${styles.navItemWide}`} />
        <span className={`skeleton ${styles.navItem}`} />
      </aside>
      <main className={styles.main}>
        <span className={`skeleton ${styles.pageTitle}`} />
        <span className={`skeleton ${styles.pageBlock}`} />
        <span className={`skeleton ${styles.pageBlockShort}`} />
      </main>
    </div>
  )
}
