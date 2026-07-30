import { useLocation } from 'react-router'
import { CompetenciaSelector } from '../ui/CompetenciaSelector'
import styles from './PageHeader.module.css'

const titles: Record<string, string> = {
  '/despesas': 'Cadastro de despesas',
  '/receitas': 'Cadastro de receitas',
  '/categorias': 'Categorias',
  '/cartoes': 'Cartão',
  '/pagadores': 'Pagadores',
  '/convites': 'Convites',
}

export function PageHeader() {
  const { pathname } = useLocation()
  const title = titles[pathname] ?? 'Registros Financeiros'
  const showCompetencia = pathname === '/despesas' || pathname === '/receitas'

  return (
    <div className={styles.pageHeader}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{title}</h1>
      </div>
      {showCompetencia ? (
        <div className={styles.competencia}>
          <CompetenciaSelector />
        </div>
      ) : null}
    </div>
  )
}
