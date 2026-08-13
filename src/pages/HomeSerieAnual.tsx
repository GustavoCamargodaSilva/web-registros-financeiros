import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { formatCurrency, formatEixoCompacto } from '../utils/format'
import type { PontoSerieMensalMista, VariacaoTotalAno } from '../utils/homeSerieAnual'
import {
  classeDirecaoVariacao,
  rotuloVariacao,
} from '../utils/relatoriosComparacoes'
import styles from './HomeSerieAnual.module.css'

interface HomeSerieAnualProps {
  ano: number
  pontos: PontoSerieMensalMista[]
  variacaoDespesas: VariacaoTotalAno
  variacaoReceitas?: VariacaoTotalAno
  loading?: boolean
}

export function HomeSerieAnual({
  ano,
  pontos,
  variacaoDespesas,
  variacaoReceitas,
  loading = false,
}: HomeSerieAnualProps) {
  if (loading) {
    return (
      <Card>
        <h2 className={styles.sectionTitle}>Evolução {ano}</h2>
        <span className={`skeleton ${styles.skeletonChart}`} />
      </Card>
    )
  }

  const semDados =
    pontos.length === 0 || pontos.every((p) => p.receitas === 0 && p.despesas === 0)

  return (
    <Card>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Evolução {ano}</h2>
        {variacaoReceitas ? (
          <p
            className={`${styles.variacao} ${styles[`variacao_${classeDirecaoVariacao(variacaoReceitas)}`]}`}
            role="status"
          >
            {rotuloVariacao('YoY receitas YTD', variacaoReceitas)}
          </p>
        ) : null}
        <p
          className={`${styles.variacao} ${styles[`variacao_${classeDirecaoVariacao(variacaoDespesas)}`]}`}
          role="status"
        >
          {rotuloVariacao('YoY despesas YTD', variacaoDespesas)}
        </p>
      </div>

      {semDados ? (
        <p className={styles.empty}>Sem movimentações neste período.</p>
      ) : (
        <div
          className={styles.chartWrap}
          role="img"
          aria-label={`Evolução de receitas, despesas e saldo em ${ano}`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={pontos} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatEixoCompacto}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value ?? 0)),
                  String(name),
                ]}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 13, paddingBottom: 8 }}
              />
              <Line
                type="monotone"
                dataKey="receitas"
                name="Receitas"
                stroke="var(--color-success)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-success)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="despesas"
                name="Despesas"
                stroke="var(--color-danger)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-danger)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
