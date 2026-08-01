import type { Despesa } from '../types/despesa.types'
import type { Receita } from '../types/receita.types'
import { calcularResumoDespesas } from './despesasResumo'
import { calcularResumoReceitas } from './receitasResumo'

export interface BalancoMes {
  totalEntradas: number
  totalSaidas: number
}

export function calcularBalancoMes(receitas: Receita[], despesas: Despesa[]): BalancoMes {
  return {
    totalEntradas: calcularResumoReceitas(receitas).totalGeral,
    totalSaidas: calcularResumoDespesas(despesas).totalGeral,
  }
}
