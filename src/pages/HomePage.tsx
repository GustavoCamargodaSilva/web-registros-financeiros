import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../components/ui/Card'
import { useCompetencia } from '../context/CompetenciaContext'
import {
  useCategoriasQuery,
  useDespesasCompetenciaQuery,
  useReceitasCompetenciaQuery,
} from '../hooks/queries/useFinanceQueries'
import { calcularResumoDespesas } from '../utils/despesasResumo'
import { formatCurrency } from '../utils/format'
import { calcularBalancoMes } from '../utils/homeBalanco'
import { calcularGastosPorCategoria } from '../utils/homeGastosPorCategoria'
import { HomeDespesasPorCategoria } from './HomeDespesasPorCategoria'
import { HomeRankingCategorias } from './HomeRankingCategorias'
import styles from './home.module.css'

function barWidthPercent(value: number, max: number): number {
  if (max <= 0) return 0
  return Math.max(4, Math.round((value / max) * 100))
}

function HomeSkeleton() {
  return (
    <div
      className={`${styles.grid} ${styles.gridTwo}`}
      aria-busy="true"
      aria-label="Carregando visão do mês"
    >
      <Card>
        <h2 className={styles.sectionTitle}>Renda e gastos</h2>
        <span className={`skeleton ${styles.skeletonBar}`} />
        <span className={`skeleton ${styles.skeletonBar}`} />
      </Card>
      <Card>
        <h2 className={styles.sectionTitle}>Gastos em conjunto</h2>
        <span className={`skeleton ${styles.skeletonValue}`} />
        <span className={`skeleton ${styles.skeletonHint}`} />
      </Card>
      <Card>
        <h2 className={styles.sectionTitle}>Despesas por categoria</h2>
        <span className={`skeleton ${styles.skeletonChart}`} />
      </Card>
      <Card>
        <h2 className={styles.sectionTitle}>Ranking de categorias</h2>
        <span className={`skeleton ${styles.skeletonBar}`} />
        <span className={`skeleton ${styles.skeletonBar}`} />
        <span className={`skeleton ${styles.skeletonBar}`} />
      </Card>
      <Card>
        <h2 className={styles.sectionTitle}>Gastos individuais</h2>
        <span className={`skeleton ${styles.skeletonChart}`} />
      </Card>
    </div>
  )
}

export function HomePage() {
  const { ano, mes } = useCompetencia()
  const despesasQuery = useDespesasCompetenciaQuery(ano, mes)
  const receitasQuery = useReceitasCompetenciaQuery(ano, mes)
  const categoriasQuery = useCategoriasQuery()

  const despesas = despesasQuery.data ?? []
  const receitas = receitasQuery.data?.receitas ?? []
  const categorias = categoriasQuery.data ?? []

  const isInitialLoading =
    despesasQuery.isPending || receitasQuery.isPending || categoriasQuery.isPending
  const isRefreshing =
    (despesasQuery.isFetching || receitasQuery.isFetching) && !isInitialLoading

  const balanco = useMemo(() => calcularBalancoMes(receitas, despesas), [receitas, despesas])
  const porCategoria = useMemo(
    () => calcularGastosPorCategoria(despesas, categorias),
    [despesas, categorias],
  )
  const resumoDespesas = useMemo(() => calcularResumoDespesas(despesas), [despesas])
  const balancoMax = Math.max(balanco.totalEntradas, balanco.totalSaidas, 1)

  const individuaisData = useMemo(
    () =>
      resumoDespesas.porResponsavel.map((item) => ({
        nome: item.nome,
        total: item.total,
      })),
    [resumoDespesas.porResponsavel],
  )

  if (isInitialLoading) {
    return <HomeSkeleton />
  }

  return (
    <div className={`${styles.grid} ${styles.gridTwo}`} aria-busy={isRefreshing || undefined}>
      {isRefreshing ? (
        <p className={styles.refreshHint} role="status">
          Atualizando competência…
        </p>
      ) : null}

      <Card>
        <h2 className={styles.sectionTitle}>Renda e gastos</h2>
        {balanco.totalEntradas === 0 && balanco.totalSaidas === 0 ? (
          <p className={styles.empty}>Sem lançamentos nesta competência.</p>
        ) : (
          <>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Renda</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${styles.barIncome}`}
                  style={{ width: `${barWidthPercent(balanco.totalEntradas, balancoMax)}%` }}
                />
              </div>
              <span className={styles.barValue}>{formatCurrency(balanco.totalEntradas)}</span>
            </div>
            <div className={styles.barRow}>
              <span className={styles.barLabel}>Gastos</span>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${styles.barExpense}`}
                  style={{ width: `${barWidthPercent(balanco.totalSaidas, balancoMax)}%` }}
                />
              </div>
              <span className={styles.barValue}>{formatCurrency(balanco.totalSaidas)}</span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Gastos em conjunto</h2>
        {resumoDespesas.totalConjuntas <= 0 ? (
          <p className={styles.empty}>Nenhuma despesa conjunta neste mês.</p>
        ) : (
          <>
            <p className={styles.highlightValue}>{formatCurrency(resumoDespesas.totalConjuntas)}</p>
            <p className={styles.highlightHint}>
              {resumoDespesas.totalGeral > 0
                ? `${((resumoDespesas.totalConjuntas / resumoDespesas.totalGeral) * 100).toFixed(1)}% do total de gastos`
                : null}
            </p>
          </>
        )}
      </Card>

      <HomeDespesasPorCategoria itens={porCategoria} />

      <HomeRankingCategorias itens={porCategoria} />

      <Card>
        <h2 className={styles.sectionTitle}>Gastos individuais</h2>
        {individuaisData.length === 0 ? (
          <p className={styles.empty}>Nenhuma despesa individual neste mês.</p>
        ) : (
          <div className={styles.chartWrap}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={individuaisData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={72}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
