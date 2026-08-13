import { useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { useCompetencia } from '../context/CompetenciaContext'
import {
  useDespesasAgregadosQuery,
  useDespesasCompetenciaQuery,
  useDespesasTotaisAnuaisQuery,
  useReceitasAgregadosQuery,
  useReceitasCompetenciaQuery,
  useReceitasTotaisAnuaisQuery,
} from '../hooks/queries/useFinanceQueries'
import { calcularBalancoMes } from '../utils/homeBalanco'
import { mesLimiteSerieAnual, montarPontosSerieMista } from '../utils/homeSerieAnual'
import {
  listarDespesasPendentes,
  listarReceitasPendentes,
  resumirPagoPendente,
} from '../utils/relatoriosComparacoes'
import { HomeContasPendentes } from './HomeContasPendentes'
import { HomeDespesasPorCategoria } from './HomeDespesasPorCategoria'
import { HomePagoPendente } from './HomePagoPendente'
import { HomeReceitasPorPagador } from './HomeReceitasPorPagador'
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
        </Card>
      </div>
    </div>
  )
}

export function HomePage() {
  const { ano, mes } = useCompetencia()

  const despesasQuery = useDespesasCompetenciaQuery(ano, mes)
  const receitasQuery = useReceitasCompetenciaQuery(ano, mes)

  const catAtual = useDespesasAgregadosQuery(ano, mes, 'categoria')
  const pagAtual = useReceitasAgregadosQuery(ano, mes, 'pagador')
  const pagoDespesas = useDespesasAgregadosQuery(ano, mes, 'pago')
  const pagoReceitas = useReceitasAgregadosQuery(ano, mes, 'pago')

  const receitasAnoQuery = useReceitasTotaisAnuaisQuery(ano)
  const despesasAnoQuery = useDespesasTotaisAnuaisQuery(ano)

  const despesas = despesasQuery.data ?? []
  const receitas = receitasQuery.data?.receitas ?? []

  const isInitialLoading =
    despesasQuery.isPending || receitasQuery.isPending || catAtual.isPending || pagAtual.isPending
  const isRefreshing =
    (despesasQuery.isFetching || receitasQuery.isFetching) && !isInitialLoading

  const serieLoading = receitasAnoQuery.isPending || despesasAnoQuery.isPending

  const balanco = useMemo(() => calcularBalancoMes(receitas, despesas), [receitas, despesas])

  const categorias = useMemo(
    () =>
      (catAtual.data?.itens ?? []).map((item) => ({
        id: item.id ?? 0,
        nome: item.chave,
        total: item.total,
        percentual: item.percentual,
      })),
    [catAtual.data],
  )

  const pagadores = useMemo(() => pagAtual.data?.itens ?? [], [pagAtual.data])

  const statusDespesas = useMemo(() => {
    if (pagoDespesas.data?.itens.length) {
      const pago = pagoDespesas.data.itens.find((i) => i.chave === 'pago')?.total ?? 0
      const pendente = pagoDespesas.data.itens.find((i) => i.chave === 'pendente')?.total ?? 0
      return resumirPagoPendente([
        { pago: true, valor: pago },
        { pago: false, valor: pendente },
      ])
    }
    return resumirPagoPendente(despesas)
  }, [pagoDespesas.data, despesas])

  const statusReceitas = useMemo(() => {
    if (pagoReceitas.data?.itens.length) {
      const pago = pagoReceitas.data.itens.find((i) => i.chave === 'pago')?.total ?? 0
      const pendente = pagoReceitas.data.itens.find((i) => i.chave === 'pendente')?.total ?? 0
      return resumirPagoPendente([
        { pago: true, valor: pago },
        { pago: false, valor: pendente },
      ])
    }
    return resumirPagoPendente(receitas)
  }, [pagoReceitas.data, receitas])

  const contasPagar = useMemo(() => listarDespesasPendentes(despesas), [despesas])
  const contasReceber = useMemo(() => listarReceitasPendentes(receitas), [receitas])

  const pontosSerie = useMemo(() => {
    const mesLimite = mesLimiteSerieAnual(ano)
    return montarPontosSerieMista(
      receitasAnoQuery.data?.totaisMensais ?? [],
      despesasAnoQuery.data?.totaisMensais ?? [],
      mesLimite,
    )
  }, [ano, receitasAnoQuery.data, despesasAnoQuery.data])

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

      <HomeDespesasPorCategoria itens={categorias} />

      <HomeReceitasPorPagador itens={pagadores} />

      <HomePagoPendente despesas={statusDespesas} receitas={statusReceitas} />

      <div className={styles.fullWidth}>
        <HomeSerieAnual ano={ano} pontos={pontosSerie} loading={serieLoading} />
      </div>

      <HomeContasPendentes despesas={contasPagar} receitas={contasReceber} />
    </div>
  )
}
