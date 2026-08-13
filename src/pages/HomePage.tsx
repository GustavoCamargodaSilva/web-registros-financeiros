import { useMemo } from 'react'
import { Card } from '../components/ui/Card'
import { useCompetencia } from '../context/CompetenciaContext'
import {
  useBalancoSerieAnualQuery,
  useDespesasAgregadosQuery,
  useDespesasCompetenciaQuery,
  useDespesasTotaisAnuaisQuery,
  useReceitasAgregadosQuery,
  useReceitasCompetenciaQuery,
  useReceitasTotaisAnuaisQuery,
} from '../hooks/queries/useFinanceQueries'
import { calcularBalancoMes } from '../utils/homeBalanco'
import {
  calcularVariacaoTotalAno,
  mesLimiteSerieAnual,
  montarPontosSerieMista,
  somarTotaisAteMes,
} from '../utils/homeSerieAnual'
import {
  competenciaAnterior,
  compararValores,
  cruzarAgregadosComMoM,
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
  const anterior = competenciaAnterior(ano, mes)

  const despesasQuery = useDespesasCompetenciaQuery(ano, mes)
  const receitasQuery = useReceitasCompetenciaQuery(ano, mes)
  const despesasAntQuery = useDespesasCompetenciaQuery(anterior.ano, anterior.mes)
  const receitasAntQuery = useReceitasCompetenciaQuery(anterior.ano, anterior.mes)

  const catAtual = useDespesasAgregadosQuery(ano, mes, 'categoria')
  const catAnt = useDespesasAgregadosQuery(anterior.ano, anterior.mes, 'categoria')
  const pagAtual = useReceitasAgregadosQuery(ano, mes, 'pagador')
  const pagAnt = useReceitasAgregadosQuery(anterior.ano, anterior.mes, 'pagador')
  const pagoDespesas = useDespesasAgregadosQuery(ano, mes, 'pago')
  const pagoReceitas = useReceitasAgregadosQuery(ano, mes, 'pago')

  const balancoAno = useBalancoSerieAnualQuery(ano)
  const balancoAnoAnterior = useBalancoSerieAnualQuery(ano - 1)
  const receitasAnoQuery = useReceitasTotaisAnuaisQuery(ano)
  const receitasAnoAnteriorQuery = useReceitasTotaisAnuaisQuery(ano - 1)
  const despesasAnoQuery = useDespesasTotaisAnuaisQuery(ano)
  const despesasAnoAnteriorQuery = useDespesasTotaisAnuaisQuery(ano - 1)

  const despesas = despesasQuery.data ?? []
  const receitas = receitasQuery.data?.receitas ?? []

  const isInitialLoading =
    despesasQuery.isPending || receitasQuery.isPending || catAtual.isPending || pagAtual.isPending
  const isRefreshing =
    (despesasQuery.isFetching || receitasQuery.isFetching) && !isInitialLoading

  const serieLoading =
    receitasAnoQuery.isPending ||
    despesasAnoQuery.isPending ||
    despesasAnoAnteriorQuery.isPending ||
    receitasAnoAnteriorQuery.isPending

  const balanco = useMemo(() => calcularBalancoMes(receitas, despesas), [receitas, despesas])
  const balancoMesAnterior = useMemo(
    () =>
      calcularBalancoMes(
        receitasAntQuery.data?.receitas ?? [],
        despesasAntQuery.data ?? [],
      ),
    [receitasAntQuery.data, despesasAntQuery.data],
  )

  const momRenda = compararValores(balanco.totalEntradas, balancoMesAnterior.totalEntradas)
  const momGastos = compararValores(balanco.totalSaidas, balancoMesAnterior.totalSaidas)
  const momDisponivel = compararValores(balanco.disponivel, balancoMesAnterior.disponivel)

  const categoriasComMoM = useMemo(() => {
    const cruzados = cruzarAgregadosComMoM(catAtual.data?.itens ?? [], catAnt.data?.itens ?? [])
    return cruzados.map((item) => ({
      id: item.id ?? 0,
      nome: item.chave,
      total: item.total,
      percentual: item.percentual,
      mom: item.mom,
    }))
  }, [catAtual.data, catAnt.data])

  const pagadoresMoM = useMemo(
    () => cruzarAgregadosComMoM(pagAtual.data?.itens ?? [], pagAnt.data?.itens ?? []),
    [pagAtual.data, pagAnt.data],
  )

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

  const serie = useMemo(() => {
    const mesLimite = mesLimiteSerieAnual(ano)
    const totaisReceitas = receitasAnoQuery.data?.totaisMensais ?? []
    const totaisDespesas = despesasAnoQuery.data?.totaisMensais ?? []
    const totaisDespesasAnterior = despesasAnoAnteriorQuery.data?.totaisMensais ?? []
    const totaisReceitasAnterior = receitasAnoAnteriorQuery.data?.totaisMensais ?? []

    return {
      pontos: montarPontosSerieMista(totaisReceitas, totaisDespesas, mesLimite),
      variacaoDespesas: calcularVariacaoTotalAno(
        somarTotaisAteMes(totaisDespesas, mesLimite),
        somarTotaisAteMes(totaisDespesasAnterior, mesLimite),
      ),
      variacaoReceitas: calcularVariacaoTotalAno(
        somarTotaisAteMes(totaisReceitas, mesLimite),
        somarTotaisAteMes(totaisReceitasAnterior, mesLimite),
      ),
    }
  }, [
    ano,
    receitasAnoQuery.data,
    despesasAnoQuery.data,
    despesasAnoAnteriorQuery.data,
    receitasAnoAnteriorQuery.data,
  ])

  const yoySaldoMes = useMemo(() => {
    const atual = balancoAno.data?.meses.find((item) => item.mes === mes)?.saldo ?? 0
    const ant = balancoAnoAnterior.data?.meses.find((item) => item.mes === mes)?.saldo ?? 0
    return compararValores(atual, ant)
  }, [balancoAno.data, balancoAnoAnterior.data, mes])

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

      <p className={styles.metricHint}>
        Visão da competência selecionada · métrica <strong>competência</strong> (pagos + pendentes)
      </p>

      <HomeRendaGastos
        balanco={balanco}
        momRenda={momRenda}
        momGastos={momGastos}
        momDisponivel={momDisponivel}
        yoySaldoMes={yoySaldoMes}
      />

      <HomeDespesasPorCategoria itens={categoriasComMoM} />

      <HomeReceitasPorPagador itens={pagadoresMoM} />

      <HomePagoPendente despesas={statusDespesas} receitas={statusReceitas} />

      <div className={styles.fullWidth}>
        <HomeSerieAnual
          ano={ano}
          pontos={serie.pontos}
          variacaoDespesas={serie.variacaoDespesas}
          variacaoReceitas={serie.variacaoReceitas}
          loading={serieLoading}
        />
      </div>

      <HomeContasPendentes despesas={contasPagar} receitas={contasReceber} />
    </div>
  )
}
