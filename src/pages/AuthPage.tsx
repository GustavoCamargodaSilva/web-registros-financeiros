import type { ReactNode } from 'react'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import styles from './auth.module.css'

/**
 * Moldura das telas que ficam fora do AppShell (login, registro, convite).
 * Concentra o fundo, a centralização do cartão e o botão de tema — sem ela o
 * usuário não conseguiria trocar de tema antes de autenticar.
 */
export function AuthPage({ children }: { children: ReactNode }) {
  return (
    <div className={styles.authPage}>
      <div className={styles.themeToggle}>
        <ThemeToggle variant="outline" />
      </div>
      <div className={styles.card}>{children}</div>
    </div>
  )
}
