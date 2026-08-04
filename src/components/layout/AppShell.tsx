import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AmbienteProvider } from '../../context/AmbienteContext'
import { useAuth } from '../../context/AuthContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Drawer } from './Drawer'
import { Header } from './Header'
import { IconClose } from './NavIcons'
import { PageHeader } from './PageHeader'
import { Sidebar } from './Sidebar'
import styles from './AppShell.module.css'

const DRAWER_ID = 'app-drawer'

export function AppShell() {
  const { isMobile } = useBreakpoint()
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false)
    }
  }, [isMobile])

  return (
    <AmbienteProvider>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Header
            onMenuClick={isMobile ? () => setDrawerOpen((open) => !open) : undefined}
            menuOpen={drawerOpen}
            menuControls={DRAWER_ID}
            showThemeToggle={!isMobile}
          />
        </header>

        {isMobile ? (
          <Drawer
            id={DRAWER_ID}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            ariaLabel="Menu principal"
          >
            <div className={styles.drawerHead}>
              {usuario ? (
                <div className={styles.drawerUser}>
                  <span className={styles.drawerUserLabel}>Conectado como</span>
                  <span className={styles.drawerUserName}>{usuario.nome}</span>
                </div>
              ) : (
                <span />
              )}
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
              >
                <IconClose />
              </button>
            </div>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
            <div className={styles.drawerFooter}>
              <span className={styles.drawerFooterLabel}>Tema</span>
              <ThemeToggle variant="outline" />
            </div>
          </Drawer>
        ) : (
          <aside className={styles.sidebar}>
            <Sidebar />
          </aside>
        )}

        <main className={styles.main}>
          <PageHeader />
          <Outlet />
        </main>
      </div>
    </AmbienteProvider>
  )
}
