import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { formatCurrency, formatEixoCompacto, formatPercent } from '../utils/format'
import type { PontoSerieMensal, VariacaoTotalAno } from '../utils/homeSerieAnual'
import styles from './HomeSerieAnual.module.css'

interface HomeSerieAnualProps {
  ano: number
  pontosReceitas: PontoSerieMensal[]
  pontosDespesas: PontoSerieMensal[]
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

function ChartLine({
  titulo,
  pontos,
  cor,
  emptyLabel,
}: {
  titulo: string
  pontos: PontoSerieMensal[]
  cor: string
  emptyLabel: string
}) {
  const semDados = pontos.length === 0 || pontos.every((p) => p.total === 0)

  return (
    <div className={styles.chartBlock}>
      <h3 className={styles.chartTitle}>{titulo}</h3>
      {semDados ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <div className={styles.chartWrap} role="img" aria-label={titulo}>
          <ResponsiveContainer width="100%" height={220}>
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
                formatter={(value) => formatCurrency(Number(value ?? 0))}
                labelFormatter={(label) => String(label)}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke={cor}
                strokeWidth={2.5}
                dot={{ r: 3, fill: cor, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export function HomeSerieAnual({
  ano,
  pontosReceitas,
  pontosDespesas,
  variacaoDespesas,
  loading = false,
}: HomeSerieAnualProps) {
  if (loading) {
    return (
      <Card>
        <h2 className={styles.sectionTitle}>Evolução {ano}</h2>
        <span className={`skeleton ${styles.skeletonChart}`} />
        <span className={`skeleton ${styles.skeletonChart}`} />
      </Card>
    )
  }

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

      <ChartLine
        titulo="Receitas no ano"
        pontos={pontosReceitas}
        cor="var(--color-success)"
        emptyLabel="Sem receitas neste período."
      />

      <ChartLine
        titulo="Despesas no ano"
        pontos={pontosDespesas}
        cor="var(--color-danger)"
        emptyLabel="Sem despesas neste período."
      />
    </Card>
  )
}
