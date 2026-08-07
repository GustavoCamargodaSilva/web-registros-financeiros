import type { Despesa } from '../types/despesa.types'
import type { Receita } from '../types/receita.types'
import { calcularResumoDespesas } from './despesasResumo'
import { calcularResumoReceitas } from './receitasResumo'

export interface BalancoMes {
  totalEntradas: number
  totalSaidas: number
  /** Renda − gastos (pode ser negativo). */
  disponivel: number
  /**
   * (gastos / renda) * 100 quando há renda; `null` se renda = 0
   * (não há base para o percentual).
   */
  percentualDaRenda: number | null
  /** Renda zerada ou gastos acima da renda — sinal visual de alerta na UI. */
  alerta: boolean
}

export function calcularBalancoMes(receitas: Receita[], despesas: Despesa[]): BalancoMes {
  const totalEntradas = calcularResumoReceitas(receitas).totalGeral
  const totalSaidas = calcularResumoDespesas(despesas).totalGeral
  const disponivel = totalEntradas - totalSaidas
  const percentualDaRenda =
    totalEntradas > 0 ? (totalSaidas / totalEntradas) * 100 : null

  return {
    totalEntradas,
    totalSaidas,
    disponivel,
    percentualDaRenda,
    alerta: (totalEntradas <= 0 && totalSaidas > 0) || totalSaidas > totalEntradas,
  }
}
