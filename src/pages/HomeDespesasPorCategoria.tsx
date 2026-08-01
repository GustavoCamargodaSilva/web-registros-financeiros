import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '../components/ui/Card'
import { formatCurrency } from '../utils/format'
import type { GastoPorCategoria } from '../utils/homeGastosPorCategoria'
import { limitarCategoriasParaDonut } from '../utils/limitarCategoriasParaDonut'
import styles from './HomeDespesasPorCategoria.module.css'

const CATEGORY_COLORS = [
  '#60a5fa',
  '#a78bfa',
  '#fbbf24',
  '#1e3a8a',
  '#6366f1',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#64748b',
]

const LABEL_MIN_PERCENT = 0.05

type PieLabelProps = {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}

function renderPercentLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent = 0,
}: PieLabelProps) {
  if (percent < LABEL_MIN_PERCENT) {
    return null
  }

  const radian = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * radian)
  const y = cy + radius * Math.sin(-midAngle * radian)

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  )
}

interface HomeDespesasPorCategoriaProps {
  itens: GastoPorCategoria[]
}

export function HomeDespesasPorCategoria({ itens }: HomeDespesasPorCategoriaProps) {
  const limitados = limitarCategoriasParaDonut(itens)
  const total = limitados.reduce((acc, item) => acc + item.total, 0)
  const donutData = limitados.map((item, index) => ({
    ...item,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))

  return (
    <Card>
      <h2 className={styles.sectionTitle}>Despesas por categoria</h2>
      {donutData.length === 0 ? (
        <p className={styles.empty}>Sem despesas para agrupar por categoria.</p>
      ) : (
        <div className={styles.categoryCenter}>
          <div className={styles.categoryLayout}>
            <div className={styles.donutWrap}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="total"
                    nameKey="nome"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="var(--color-surface)"
                    strokeWidth={3}
                    label={renderPercentLabel}
                    labelLine={false}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.id} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => [
                      formatCurrency(Number(value ?? 0)),
                      String(item?.payload?.nome ?? ''),
                    ]}
                    contentStyle={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.donutCenter} aria-hidden>
                <span className={styles.donutTotal}>{formatCurrency(total)}</span>
              </div>
            </div>
            <ul className={styles.legend}>
              {donutData.map((item) => (
                <li
                  key={item.id}
                  className={styles.legendItem}
                  title={`${item.nome}: ${formatCurrency(item.total)} (${item.percentual.toFixed(1)}%)`}
                >
                  <span className={styles.swatch} style={{ background: item.fill }} />
                  <span className={styles.legendName}>{item.nome}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  )
}
