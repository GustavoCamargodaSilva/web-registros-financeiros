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
import { formatCurrency, formatEixoCompacto, formatPercent } from '../utils/format'
import type { PontoSerieMensalMista, VariacaoTotalAno } from '../utils/homeSerieAnual'
import styles from './HomeSerieAnual.module.css'

interface HomeSerieAnualProps {
  ano: number
  pontos: PontoSerieMensalMista[]
  variacaoDespesas: VariacaoTotalAno
  loading?: boolean
}

function rotuloVariacao(variacao: VariacaoTotalAno): string {
  const abs = formatCurrency(Math.abs(variacao.delta))
  const pct =
    variacao.percentual == null ? null : formatPercent(Math.abs(variacao.percentual))

  switch (variacao.direcao) {
    case 'alta':
      return pct
        ? `Despesas subiram ${abs} (${pct}) vs ano anterior`
        : `Despesas subiram ${abs} vs ano anterior`
    case 'baixa':
      return pct
        ? `Despesas baixaram ${abs} (${pct}) vs ano anterior`
        : `Despesas baixaram ${abs} vs ano anterior`
    case 'estavel':
      return 'Despesas estáveis vs ano anterior'
    case 'indefinida':
      return `Despesas em ${formatCurrency(variacao.totalAtual)} (sem base no ano anterior)`
  }
}

export function HomeSerieAnual({
  ano,
  pontos,
  variacaoDespesas,
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
        <p
          className={`${styles.variacao} ${
            variacaoDespesas.direcao === 'alta'
              ? styles.variacao_alta
              : variacaoDespesas.direcao === 'baixa'
                ? styles.variacao_baixa
                : styles.variacao_neutra
          }`}
          role="status"
        >
          {rotuloVariacao(variacaoDespesas)}
        </p>
      </div>

      {semDados ? (
        <p className={styles.empty}>Sem movimentações neste período.</p>
      ) : (
        <div className={styles.chartWrap} role="img" aria-label={`Evolução de receitas e despesas em ${ano}`}>
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
