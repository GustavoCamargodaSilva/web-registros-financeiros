import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import styles from './Header.module.css'

export function Header() {
  const { usuario, logout } = useAuth()

  return (
    <div className={styles.header}>
      <div className={styles.brandBlock}>
        <span className={styles.mark} aria-hidden>
          RF
        </span>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Registros Financeiros</span>
          {usuario ? <span className={styles.user}>Olá, {usuario.nome}</span> : null}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => void logout()}>
          Sair
        </Button>
      </div>
    </div>
  )
}
