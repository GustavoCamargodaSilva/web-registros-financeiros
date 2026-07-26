import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { PageHeader } from './PageHeader'
import { Sidebar } from './Sidebar'
import styles from './AppShell.module.css'

export function AppShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Header />
      </header>
      <aside className={styles.sidebar}>
        <Sidebar />
      </aside>
      <main className={styles.main}>
        <PageHeader />
        <Outlet />
      </main>
    </div>
  )
}
