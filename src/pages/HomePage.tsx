import { useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { useCompetencia } from '../context/CompetenciaContext'
import {
  useCategoriasQuery,
  useDespesasCompetenciaQuery,
  useDespesasTotaisAnuaisQuery,
  useReceitasCompetenciaQuery,
  useReceitasTotaisAnuaisQuery,
} from '../hooks/queries/useFinanceQueries'
import { calcularBalancoMes } from '../utils/homeBalanco'
import { calcularGastosPorCategoria } from '../utils/homeGastosPorCategoria'
import {
  calcularVariacaoTotalAno,
  mesLimiteSerieAnual,
  montarPontosSerie,
  somarTotaisAteMes,
} from '../utils/homeSerieAnual'
import { HomeDespesasPorCategoria } from './HomeDespesasPorCategoria'
import { HomeRendaGastos } from './HomeRendaGastos'
import { HomeSerieAnual } from './HomeSerieAnual'
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
      <div className={styles.fullWidth}>
        <Card>
          <h2 className={styles.sectionTitle}>Evolução anual</h2>
          <span className={`skeleton ${styles.skeletonChart}`} />
          <span className={`skeleton ${styles.skeletonChart}`} />
        </Card>
      </div>
    </div>
  )
}

export function HomePage() {
  const { ano, mes } = useCompetencia()
  const despesasQuery = useDespesasCompetenciaQuery(ano, mes)
  const receitasQuery = useReceitasCompetenciaQuery(ano, mes)
  const categoriasQuery = useCategoriasQuery()

  const receitasAnoQuery = useReceitasTotaisAnuaisQuery(ano)
  const despesasAnoQuery = useDespesasTotaisAnuaisQuery(ano)
  const despesasAnoAnteriorQuery = useDespesasTotaisAnuaisQuery(ano - 1)

  const despesas = despesasQuery.data ?? []
  const receitas = receitasQuery.data?.receitas ?? []
  const categorias = categoriasQuery.data ?? []

  const isInitialLoading =
    despesasQuery.isPending || receitasQuery.isPending || categoriasQuery.isPending
  const isRefreshing =
    (despesasQuery.isFetching || receitasQuery.isFetching) && !isInitialLoading

  const serieLoading =
    receitasAnoQuery.isPending || despesasAnoQuery.isPending || despesasAnoAnteriorQuery.isPending

  const balanco = useMemo(() => calcularBalancoMes(receitas, despesas), [receitas, despesas])
  const porCategoria = useMemo(
    () => calcularGastosPorCategoria(despesas, categorias),
    [despesas, categorias],
  )

  const serie = useMemo(() => {
    const mesLimite = mesLimiteSerieAnual(ano)
    const totaisReceitas = receitasAnoQuery.data?.totaisMensais ?? []
    const totaisDespesas = despesasAnoQuery.data?.totaisMensais ?? []
    const totaisDespesasAnterior = despesasAnoAnteriorQuery.data?.totaisMensais ?? []

    const totalAtual = somarTotaisAteMes(totaisDespesas, mesLimite)
    const totalAnterior = somarTotaisAteMes(totaisDespesasAnterior, mesLimite)

    return {
      pontosReceitas: montarPontosSerie(totaisReceitas, mesLimite),
      pontosDespesas: montarPontosSerie(totaisDespesas, mesLimite),
      variacaoDespesas: calcularVariacaoTotalAno(totalAtual, totalAnterior),
    }
  }, [ano, receitasAnoQuery.data, despesasAnoQuery.data, despesasAnoAnteriorQuery.data])

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

      <div className={styles.fullWidth}>
        <HomeSerieAnual
          ano={ano}
          pontosReceitas={serie.pontosReceitas}
          pontosDespesas={serie.pontosDespesas}
          variacaoDespesas={serie.variacaoDespesas}
          loading={serieLoading}
        />
      </div>
    </div>
  )
}
