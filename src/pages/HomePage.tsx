import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { categoriasApi } from '../api/categorias.api'
import { despesasApi } from '../api/despesas.api'
import { receitasApi } from '../api/receitas.api'
import { Card } from '../components/ui/Card'
import { useCompetencia } from '../context/CompetenciaContext'
import { useApiFeedback } from '../hooks/useApiFeedback'
import type { Categoria } from '../types/categoria.types'
import type { Despesa } from '../types/despesa.types'
import type { Receita } from '../types/receita.types'
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

export function HomePage() {
  const { ano, mes } = useCompetencia()
  const { handleError } = useApiFeedback()
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [despesasResponse, receitasResponse, categoriasResponse] = await Promise.all([
        despesasApi.listarPorCompetencia(ano, mes),
        receitasApi.listarPorCompetencia(ano, mes),
        categoriasApi.listar(),
      ])
      setDespesas(despesasResponse)
      setReceitas(receitasResponse.receitas)
      setCategorias(categoriasResponse)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }, [ano, mes, handleError])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const balanco = useMemo(() => calcularBalancoMes(receitas, despesas), [receitas, despesas])
  const porCategoria = useMemo(
    () => calcularGastosPorCategoria(despesas, categorias),
    [despesas, categorias],
  )
  const resumoDespesas = useMemo(() => calcularResumoDespesas(despesas), [despesas])
  const balancoMax = Math.max(balanco.totalEntradas, balanco.totalSaidas, 1)

  const individuaisData = resumoDespesas.porResponsavel.map((item) => ({
    nome: item.nome,
    total: item.total,
  }))

  if (loading) {
    return <p className={styles.loading}>Carregando visão do mês…</p>
  }

  return (
    <div className={`${styles.grid} ${styles.gridTwo}`}>
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
