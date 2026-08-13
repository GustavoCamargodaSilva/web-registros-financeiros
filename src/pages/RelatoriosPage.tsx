import { useMemo } from 'react'
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
import {
  formatCompetencia,
  formatCurrency,
  formatDate,
  formatEixoCompacto,
  formatPercent,
  MESES_CURTOS,
} from '../utils/format'
import { calcularBalancoMes } from '../utils/homeBalanco'
import {
  calcularVariacaoTotalAno,
  mesLimiteSerieAnual,
  somarTotaisAteMes,
  type VariacaoTotalAno,
} from '../utils/homeSerieAnual'
import {
  competenciaAnterior,
  compararValores,
  cruzarAgregadosComMoM,
  listarDespesasPendentes,
  listarReceitasPendentes,
  resumirPagoPendente,
} from '../utils/relatoriosComparacoes'
import styles from './RelatoriosPage.module.css'

function rotuloVariacao(prefixo: string, variacao: VariacaoTotalAno): string {
  const abs = formatCurrency(Math.abs(variacao.delta))
  const pct =
    variacao.percentual == null ? null : formatPercent(Math.abs(variacao.percentual))

  switch (variacao.direcao) {
    case 'alta':
      return pct ? `${prefixo} +${abs} (${pct})` : `${prefixo} +${abs}`
    case 'baixa':
      return pct ? `${prefixo} −${abs} (${pct})` : `${prefixo} −${abs}`
    case 'estavel':
      return `${prefixo} estável`
    case 'indefinida':
      return `${prefixo} sem base anterior`
  }
}

function classeVariacao(variacao: VariacaoTotalAno): string {
  if (variacao.direcao === 'alta') return styles.variacaoAlta
  if (variacao.direcao === 'baixa') return styles.variacaoBaixa
  return styles.variacaoNeutra
}

export function RelatoriosPage() {
  const { ano, mes } = useCompetencia()
  const anterior = competenciaAnterior(ano, mes)

  const despesasAtual = useDespesasCompetenciaQuery(ano, mes)
  const receitasAtual = useReceitasCompetenciaQuery(ano, mes)
  const despesasAnt = useDespesasCompetenciaQuery(anterior.ano, anterior.mes)
  const receitasAnt = useReceitasCompetenciaQuery(anterior.ano, anterior.mes)

  const catAtual = useDespesasAgregadosQuery(ano, mes, 'categoria')
  const catAnt = useDespesasAgregadosQuery(anterior.ano, anterior.mes, 'categoria')
  const pagAtual = useReceitasAgregadosQuery(ano, mes, 'pagador')
  const pagAnt = useReceitasAgregadosQuery(anterior.ano, anterior.mes, 'pagador')
  const pagoDespesas = useDespesasAgregadosQuery(ano, mes, 'pago')
  const pagoReceitas = useReceitasAgregadosQuery(ano, mes, 'pago')

  const balancoAno = useBalancoSerieAnualQuery(ano)
  const balancoAnoAnterior = useBalancoSerieAnualQuery(ano - 1)
  const receitasAno = useReceitasTotaisAnuaisQuery(ano)
  const receitasAnoAnterior = useReceitasTotaisAnuaisQuery(ano - 1)
  const despesasAno = useDespesasTotaisAnuaisQuery(ano)
  const despesasAnoAnterior = useDespesasTotaisAnuaisQuery(ano - 1)

  const despesas = despesasAtual.data ?? []
  const receitas = receitasAtual.data?.receitas ?? []

  const balanco = useMemo(() => calcularBalancoMes(receitas, despesas), [receitas, despesas])
  const balancoMesAnterior = useMemo(
    () =>
      calcularBalancoMes(
        receitasAnt.data?.receitas ?? [],
        despesasAnt.data ?? [],
      ),
    [receitasAnt.data, despesasAnt.data],
  )

  const momDisponivel = compararValores(balanco.disponivel, balancoMesAnterior.disponivel)
  const momGastos = compararValores(balanco.totalSaidas, balancoMesAnterior.totalSaidas)
  const momRenda = compararValores(balanco.totalEntradas, balancoMesAnterior.totalEntradas)

  const categoriasMoM = useMemo(
    () => cruzarAgregadosComMoM(catAtual.data?.itens ?? [], catAnt.data?.itens ?? []),
    [catAtual.data, catAnt.data],
  )
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

  const mesLimite = mesLimiteSerieAnual(ano)
  const pontosSaldo = useMemo(() => {
    const meses = balancoAno.data?.meses ?? []
    return meses
      .filter((item) => item.mes >= 1 && item.mes <= mesLimite)
      .map((item) => ({
        mes: item.mes,
        label: MESES_CURTOS.find((m) => m.value === item.mes)?.label ?? String(item.mes),
        receitas: item.receitas,
        despesas: item.despesas,
        saldo: item.saldo,
      }))
  }, [balancoAno.data, mesLimite])

  const yoyReceitas = useMemo(() => {
    const atual = somarTotaisAteMes(receitasAno.data?.totaisMensais ?? [], mesLimite)
    const anteriorYtd = somarTotaisAteMes(
      receitasAnoAnterior.data?.totaisMensais ?? [],
      mesLimite,
    )
    return calcularVariacaoTotalAno(atual, anteriorYtd)
  }, [receitasAno.data, receitasAnoAnterior.data, mesLimite])

  const yoyDespesas = useMemo(() => {
    const atual = somarTotaisAteMes(despesasAno.data?.totaisMensais ?? [], mesLimite)
    const anteriorYtd = somarTotaisAteMes(
      despesasAnoAnterior.data?.totaisMensais ?? [],
      mesLimite,
    )
    return calcularVariacaoTotalAno(atual, anteriorYtd)
  }, [despesasAno.data, despesasAnoAnterior.data, mesLimite])

  const yoySaldoMes = useMemo(() => {
    const atual = balancoAno.data?.meses.find((m) => m.mes === mes)?.saldo ?? 0
    const ant =
      balancoAnoAnterior.data?.meses.find((m) => m.mes === mes)?.saldo ?? 0
    return compararValores(atual, ant)
  }, [balancoAno.data, balancoAnoAnterior.data, mes])

  const loadingInicial =
    despesasAtual.isPending ||
    receitasAtual.isPending ||
    catAtual.isPending ||
    pagAtual.isPending

  if (loadingInicial) {
    return (
      <div className={styles.page} aria-busy="true" aria-label="Carregando relatórios">
        <Card>
          <span className={`skeleton ${styles.skeletonBlock}`} />
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <p className={styles.intro}>
        Relatórios de {formatCompetencia(ano, mes)}. Métrica: <strong>competência</strong> (pagos
        + pendentes), salvo onde indicado.
      </p>

      <div className={`${styles.grid} ${styles.gridTwo}`}>
        <Card>
          <h2 className={styles.sectionTitle}>Balanço do mês</h2>
          <dl className={styles.metrics}>
            <div className={styles.metricRow}>
              <dt>Renda</dt>
              <dd>{formatCurrency(balanco.totalEntradas)}</dd>
            </div>
            <div className={styles.metricRow}>
              <dt>Gastos</dt>
              <dd>{formatCurrency(balanco.totalSaidas)}</dd>
            </div>
            <div className={styles.metricRow}>
              <dt>Disponível</dt>
              <dd>{formatCurrency(balanco.disponivel)}</dd>
            </div>
          </dl>
          <p className={`${styles.hint} ${classeVariacao(momRenda)}`}>
            MoM renda: {rotuloVariacao('vs mês anterior', momRenda)}
          </p>
          <p className={`${styles.hint} ${classeVariacao(momGastos)}`}>
            MoM gastos: {rotuloVariacao('vs mês anterior', momGastos)}
          </p>
          <p className={`${styles.hint} ${classeVariacao(momDisponivel)}`}>
            MoM disponível: {rotuloVariacao('vs mês anterior', momDisponivel)}
          </p>
          <p className={`${styles.hint} ${classeVariacao(yoySaldoMes)}`}>
            YoY saldo do mês: {rotuloVariacao(`vs ${mes}/${ano - 1}`, yoySaldoMes)}
          </p>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Pago × pendente</h2>
          <dl className={styles.metrics}>
            <div className={styles.metricRow}>
              <dt>Despesas pagas</dt>
              <dd>{formatCurrency(statusDespesas.pago)}</dd>
            </div>
            <div className={styles.metricRow}>
              <dt>Despesas pendentes</dt>
              <dd>{formatCurrency(statusDespesas.pendente)}</dd>
            </div>
            <div className={styles.metricRow}>
              <dt>% despesas liquidadas</dt>
              <dd>
                {statusDespesas.percentualPago == null
                  ? '—'
                  : formatPercent(statusDespesas.percentualPago)}
              </dd>
            </div>
            <div className={styles.metricRow}>
              <dt>Receitas recebidas</dt>
              <dd>{formatCurrency(statusReceitas.pago)}</dd>
            </div>
            <div className={styles.metricRow}>
              <dt>Receitas pendentes</dt>
              <dd>{formatCurrency(statusReceitas.pendente)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Despesas por categoria</h2>
          {categoriasMoM.length === 0 ? (
            <p className={styles.empty}>Sem despesas nesta competência.</p>
          ) : (
            <ul className={styles.ranking}>
              {categoriasMoM.map((item) => (
                <li key={`${item.id}-${item.chave}`} className={styles.rankingItem}>
                  <span>{item.chave}</span>
                  <strong>{formatCurrency(item.total)}</strong>
                  <span className={styles.rankingMeta}>
                    {formatPercent(item.percentual)} ·{' '}
                    <span className={classeVariacao(item.mom)}>
                      {rotuloVariacao('MoM', item.mom)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Receitas por pagador</h2>
          {pagadoresMoM.length === 0 ? (
            <p className={styles.empty}>Sem receitas nesta competência.</p>
          ) : (
            <ul className={styles.ranking}>
              {pagadoresMoM.map((item) => (
                <li key={`${item.id}-${item.chave}`} className={styles.rankingItem}>
                  <span>{item.chave}</span>
                  <strong>{formatCurrency(item.total)}</strong>
                  <span className={styles.rankingMeta}>
                    {formatPercent(item.percentual)} ·{' '}
                    <span className={classeVariacao(item.mom)}>
                      {rotuloVariacao('MoM', item.mom)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className={styles.fullWidth}>
          <Card>
            <h2 className={styles.sectionTitle}>Saldo mês a mês · {ano}</h2>
            <p className={`${styles.hint} ${classeVariacao(yoyReceitas)}`}>
              YoY receitas YTD: {rotuloVariacao('vs ano anterior', yoyReceitas)}
            </p>
            <p className={`${styles.hint} ${classeVariacao(yoyDespesas)}`}>
              YoY despesas YTD: {rotuloVariacao('vs ano anterior', yoyDespesas)}
            </p>
            {balancoAno.isPending ? (
              <span className={`skeleton ${styles.skeletonBlock}`} />
            ) : pontosSaldo.length === 0 ||
              pontosSaldo.every((p) => p.receitas === 0 && p.despesas === 0) ? (
              <p className={styles.empty}>Sem movimentações neste período.</p>
            ) : (
              <div className={styles.chartWrap} role="img" aria-label={`Saldo mensal em ${ano}`}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={pontosSaldo} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
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
                      contentStyle={{
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="receitas"
                      name="Receitas"
                      stroke="var(--color-success)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="despesas"
                      name="Despesas"
                      stroke="var(--color-danger)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      name="Saldo"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h2 className={styles.sectionTitle}>Contas a pagar</h2>
          {contasPagar.length === 0 ? (
            <p className={styles.empty}>Nenhuma despesa pendente.</p>
          ) : (
            <>
              <p className={styles.hint}>
                Em aberto: {formatCurrency(contasPagar.reduce((acc, d) => acc + d.valor, 0))}
              </p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Vencimento</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {contasPagar.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.vencimento)}</td>
                      <td>{item.descricao}</td>
                      <td className={styles.moneyExpense}>{formatCurrency(item.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Contas a receber</h2>
          {contasReceber.length === 0 ? (
            <p className={styles.empty}>Nenhuma receita pendente.</p>
          ) : (
            <>
              <p className={styles.hint}>
                Em aberto: {formatCurrency(contasReceber.reduce((acc, r) => acc + r.valor, 0))}
              </p>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Pagador</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {contasReceber.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.dataPagamento)}</td>
                      <td>{item.pagadorDescricao}</td>
                      <td className={styles.moneyIncome}>{formatCurrency(item.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
