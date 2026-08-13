import { Card } from '../components/ui/Card'
import { formatCurrency, formatPercent } from '../utils/format'
import type { StatusPagoResumo } from '../utils/relatoriosComparacoes'
import styles from './HomeRanking.module.css'

interface HomePagoPendenteProps {
  despesas: StatusPagoResumo
  receitas: StatusPagoResumo
}

export function HomePagoPendente({ despesas, receitas }: HomePagoPendenteProps) {
  return (
    <Card>
      <h2 className={styles.sectionTitle}>Pago × pendente</h2>
      <dl className={styles.metrics}>
        <div className={styles.metricRow}>
          <dt>Despesas pagas</dt>
          <dd>{formatCurrency(despesas.pago)}</dd>
        </div>
        <div className={styles.metricRow}>
          <dt>Despesas pendentes</dt>
          <dd>{formatCurrency(despesas.pendente)}</dd>
        </div>
        <div className={styles.metricRow}>
          <dt>% despesas liquidadas</dt>
          <dd>
            {despesas.percentualPago == null ? '—' : formatPercent(despesas.percentualPago)}
          </dd>
        </div>
        <div className={styles.metricRow}>
          <dt>Receitas recebidas</dt>
          <dd>{formatCurrency(receitas.pago)}</dd>
        </div>
        <div className={styles.metricRow}>
          <dt>Receitas pendentes</dt>
          <dd>{formatCurrency(receitas.pendente)}</dd>
        </div>
      </dl>
    </Card>
  )
}
