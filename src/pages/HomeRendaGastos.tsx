import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card } from '../components/ui/Card'
import { formatCurrency, formatPercentFixed2 } from '../utils/format'
import type { BalancoMes } from '../utils/homeBalanco'
import styles from './HomeRendaGastos.module.css'

interface HomeRendaGastosProps {
  balanco: BalancoMes
}

export function HomeRendaGastos({ balanco }: HomeRendaGastosProps) {
  const semLancamentos = balanco.totalEntradas === 0 && balanco.totalSaidas === 0

  const disponivelNoGrafico = Math.max(balanco.disponivel, 0)
  const donutData =
    balanco.totalSaidas <= 0 && disponivelNoGrafico <= 0
      ? []
      : [
          {
            id: 'gastos',
            nome: 'Gastos',
            total: balanco.totalSaidas > 0 ? balanco.totalSaidas : 0,
            fill: 'var(--color-danger)',
          },
          ...(disponivelNoGrafico > 0
            ? [
                {
                  id: 'disponivel',
                  nome: 'Disponível',
                  total: disponivelNoGrafico,
                  fill: 'var(--color-success)',
                },
              ]
            : []),
        ].filter((item) => item.total > 0)

  return (
    <Card>
      <h2 className={styles.sectionTitle}>Renda e gastos</h2>
      {semLancamentos ? (
        <p className={styles.empty}>Sem lançamentos nesta competência.</p>
      ) : (
        <div className={styles.layout}>
          <div
            className={`${styles.donutWrap} ${balanco.alerta ? styles.donutAlerta : ''}`}
            role="img"
            aria-label={
              balanco.percentualDaRenda == null
                ? `Gastos ${formatCurrency(balanco.totalSaidas)}, disponível ${formatCurrency(balanco.disponivel)}`
                : `${formatPercentFixed2(balanco.percentualDaRenda)} da renda em gastos`
            }
          >
            {donutData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="total"
                    nameKey="nome"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={donutData.length > 1 ? 2 : 0}
                    stroke="var(--color-surface)"
                    strokeWidth={3}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.id} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className={styles.donutCenter}>
              <span className={styles.percentValue}>
                {balanco.percentualDaRenda == null
                  ? '—'
                  : formatPercentFixed2(balanco.percentualDaRenda)}
              </span>
              <span className={styles.percentHint}>da renda</span>
            </div>
          </div>

          <dl className={styles.metrics}>
            <div className={styles.metricRow}>
              <dt>
                <span className={styles.swatch} style={{ background: 'var(--color-danger)' }} />
                Gastos
              </dt>
              <dd>{formatCurrency(balanco.totalSaidas)}</dd>
            </div>
            <div className={styles.metricRow}>
              <dt>
                <span className={styles.swatch} style={{ background: 'var(--color-success)' }} />
                Disponível
              </dt>
              <dd className={balanco.disponivel < 0 ? styles.metricNegativo : undefined}>
                {formatCurrency(balanco.disponivel)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Card>
  )
}
