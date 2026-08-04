import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { formatCurrency, formatEixoCompacto, formatPercent } from '../utils/format'
import { CATEGORY_COLORS } from '../utils/homeCategoryColors'
import type { GastoPorCategoria } from '../utils/homeGastosPorCategoria'
import { selecionarTopCategorias } from '../utils/selecionarTopCategorias'
import styles from './HomeRankingCategorias.module.css'

const TOP_N = 5
const BAR_HEIGHT_PX = 40
const CHART_PADDING_PX = 48

interface HomeRankingCategoriasProps {
  itens: GastoPorCategoria[]
}

export function HomeRankingCategorias({ itens }: HomeRankingCategoriasProps) {
  const top = selecionarTopCategorias(itens, TOP_N)
  const totalExibido = top.reduce((acc, item) => acc + item.total, 0)
  const totalGeral = itens.reduce((acc, item) => acc + item.total, 0)
  const percentualExibido = totalGeral > 0 ? (totalExibido / totalGeral) * 100 : 0

  const chartData = top.map((item, index) => ({
    ...item,
    fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))

  const chartHeight = Math.max(CHART_PADDING_PX + chartData.length * BAR_HEIGHT_PX, 120)

  return (
    <Card>
      <h2 className={styles.sectionTitle}>Ranking categorias</h2>
      {chartData.length === 0 ? (
        <p className={styles.empty}>Sem despesas para ranquear por categoria.</p>
      ) : (
        <>
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  tickFormatter={formatEixoCompacto}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={88}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={false}
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
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={22}>
                  {chartData.map((entry) => (
                    <Cell key={entry.id} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="percentual"
                    position="right"
                    formatter={(value) => formatPercent(Number(value ?? 0))}
                    style={{
                      fill: 'var(--color-text-muted)',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className={styles.footer}>
            Essas categorias totalizam{' '}
            <strong className={styles.footerValue}>{formatCurrency(totalExibido)}</strong>. Elas
            representam{' '}
            <strong className={styles.footerValue}>{formatPercent(percentualExibido)}</strong> do
            total de <strong className={styles.footerValue}>{formatCurrency(totalGeral)}</strong>.
          </p>
        </>
      )}
    </Card>
  )
}
