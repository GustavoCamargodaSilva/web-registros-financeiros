import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { IconMenu } from './NavIcons'
import styles from './Header.module.css'

interface HeaderProps {
  /** Quando informado, exibe o botão de menu. O AppShell só passa no mobile. */
  onMenuClick?: () => void
  menuOpen?: boolean
  /** id do drawer controlado, para o aria-controls. */
  menuControls?: string
}

export function Header({ onMenuClick, menuOpen = false, menuControls }: HeaderProps) {
  const { usuario, logout } = useAuth()

  return (
    <div className={styles.header}>
      <div className={styles.brandBlock}>
        {onMenuClick ? (
          <button
            type="button"
            className={styles.menuButton}
            onClick={onMenuClick}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuOpen}
            aria-controls={menuControls}
          >
            <IconMenu />
          </button>
        ) : null}
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
