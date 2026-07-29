import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useAmbientePermissoes } from '../../hooks/useAmbientePermissoes'
import {
  IconBank,
  IconCaret,
  IconList,
  IconMail,
  IconTags,
  IconUser,
  IconUsers,
  IconWallet,
} from './NavIcons'
import styles from './Sidebar.module.css'

interface MenuChild {
  to: string
  label: string
  icon: ReactNode
}

interface MenuGroup {
  id: string
  label: string
  icon: ReactNode
  children: MenuChild[]
}

const baseMenuGroups: MenuGroup[] = [
  {
    id: 'despesas',
    label: 'Despesas',
    icon: <IconWallet />,
    children: [
      { to: '/despesas', label: 'Cadastro', icon: <IconList /> },
      { to: '/categorias', label: 'Categorias', icon: <IconTags /> },
    ],
  },
  {
    id: 'receitas',
    label: 'Receitas',
    icon: <IconBank />,
    children: [
      { to: '/receitas', label: 'Cadastro', icon: <IconList /> },
      { to: '/pagadores', label: 'Pagadores', icon: <IconUsers /> },
    ],
  },
  {
    id: 'usuario',
    label: 'Usuário',
    icon: <IconUser />,
    children: [{ to: '/convites', label: 'Convites', icon: <IconMail /> }],
  },
]

function isPathInGroup(pathname: string, group: MenuGroup) {
  return group.children.some((child) => child.to === pathname)
}

interface SidebarProps {
  /** Chamado após navegar. O AppShell usa para fechar o drawer no mobile. */
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { pathname } = useLocation()
  const { canManageMembros } = useAmbientePermissoes()

  const menuGroups = useMemo(
    () => baseMenuGroups.filter((group) => group.id !== 'usuario' || canManageMembros),
    [canManageMembros],
  )

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(baseMenuGroups.map((group) => [group.id, isPathInGroup(pathname, group)])),
  )

  useEffect(() => {
    setOpenGroups((current) => {
      const next = { ...current }
      let changed = false
      for (const group of menuGroups) {
        if (isPathInGroup(pathname, group) && !next[group.id]) {
          next[group.id] = true
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [pathname, menuGroups])

  function handleGroupClick(group: MenuGroup) {
    setOpenGroups((current) => ({
      ...current,
      [group.id]: !current[group.id],
    }))
  }

  return (
    <nav className={styles.sidebar} aria-label="Menu principal">
      <div className={styles.nav}>
        {menuGroups.map((group) => {
          const isOpen = Boolean(openGroups[group.id])
          const groupActive = isPathInGroup(pathname, group)

          return (
            <div key={group.id} className={styles.group}>
              <button
                type="button"
                className={[styles.itemRow, groupActive ? styles.groupActive : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-expanded={isOpen}
                onClick={() => handleGroupClick(group)}
              >
                <span className={styles.caret}>
                  <IconCaret open={isOpen} />
                </span>
                <span className={styles.icon}>{group.icon}</span>
                <span className={styles.itemLabel}>{group.label}</span>
              </button>

              {isOpen ? (
                <div className={styles.subnav}>
                  {group.children.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => onNavigate?.()}
                      className={({ isActive }) =>
                        [styles.sublink, isActive ? styles.active : '']
                          .filter(Boolean)
                          .join(' ')
                      }
                    >
                      <span className={styles.icon}>{link.icon}</span>
                      <span>{link.label}</span>
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
