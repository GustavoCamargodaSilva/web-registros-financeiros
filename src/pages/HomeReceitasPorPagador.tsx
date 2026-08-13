import { Card } from '../components/ui/Card'
import { formatCurrency, formatPercent } from '../utils/format'
import type { AgregadoItem } from '../types/agregados.types'
import styles from './HomeRanking.module.css'

interface HomeReceitasPorPagadorProps {
  itens: AgregadoItem[]
}

export function HomeReceitasPorPagador({ itens }: HomeReceitasPorPagadorProps) {
  return (
    <Card>
      <h2 className={styles.sectionTitle}>Receitas por pagador</h2>
      {itens.length === 0 ? (
        <p className={styles.empty}>Sem receitas nesta competência.</p>
      ) : (
        <ul className={styles.ranking}>
          {itens.map((item) => (
            <li key={`${item.id}-${item.chave}`} className={styles.rankingItem}>
              <span className={styles.nome}>{item.chave}</span>
              <strong>{formatCurrency(item.total)}</strong>
              <span className={styles.meta}>{formatPercent(item.percentual)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
