import { useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { useCompetencia } from '../context/CompetenciaContext'
import {
  useCategoriasQuery,
  useDespesasCompetenciaQuery,
  useReceitasCompetenciaQuery,
} from '../hooks/queries/useFinanceQueries'
import { calcularBalancoMes } from '../utils/homeBalanco'
import { calcularGastosPorCategoria } from '../utils/homeGastosPorCategoria'
import { HomeDespesasPorCategoria } from './HomeDespesasPorCategoria'
import { HomeRendaGastos } from './HomeRendaGastos'
import styles from './home.module.css'

function HomeSkeleton() {
  return (
    <div
      className={`${styles.grid} ${styles.gridTwo}`}
      aria-busy="true"
      aria-label="Carregando visão do mês"
    >
      <Card>
        <h2 className={styles.sectionTitle}>Renda e gastos</h2>
        <span className={`skeleton ${styles.skeletonChart}`} />
      </Card>
      <Card>
        <h2 className={styles.sectionTitle}>Despesas por categoria</h2>
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

      <HomeRendaGastos balanco={balanco} />

      <HomeDespesasPorCategoria itens={porCategoria} />
    </div>
  )
}
