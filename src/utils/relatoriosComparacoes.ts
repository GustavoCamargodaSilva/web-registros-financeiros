import type { AgregadoItem } from '../types/agregados.types'
import type { Despesa } from '../types/despesa.types'
import type { Receita } from '../types/receita.types'
import { calcularVariacaoTotalAno, type VariacaoTotalAno } from './homeSerieAnual'

export interface CompetenciaRef {
  ano: number
  mes: number
}

/** Competência imediatamente anterior (dezembro do ano anterior se mês = 1). */
export function competenciaAnterior(ano: number, mes: number): CompetenciaRef {
  if (mes <= 1) {
    return { ano: ano - 1, mes: 12 }
  }
  return { ano, mes: mes - 1 }
}

export function compararValores(atual: number, anterior: number): VariacaoTotalAno {
  return calcularVariacaoTotalAno(atual, anterior)
}

export interface ItemComMoM {
  id: number | null
  chave: string
  total: number
  percentual: number
  mom: VariacaoTotalAno
}

export function cruzarAgregadosComMoM(
  atual: AgregadoItem[],
  anterior: AgregadoItem[],
): ItemComMoM[] {
  const mapaAnterior = new Map(
    anterior.map((item) => [chaveEstavel(item), item.total]),
  )

  return atual.map((item) => ({
    id: item.id,
    chave: item.chave,
    total: item.total,
    percentual: item.percentual,
    mom: compararValores(item.total, mapaAnterior.get(chaveEstavel(item)) ?? 0),
  }))
}

function chaveEstavel(item: AgregadoItem): string {
  if (item.id != null) {
    return `id:${item.id}`
  }
  return `chave:${item.chave}`
}

export interface StatusPagoResumo {
  pago: number
  pendente: number
  total: number
  percentualPago: number | null
}

export function resumirPagoPendente(valores: { pago: boolean; valor: number }[]): StatusPagoResumo {
  let pago = 0
  let pendente = 0
  for (const item of valores) {
    if (item.pago) {
      pago += item.valor
    } else {
      pendente += item.valor
    }
  }
  const total = pago + pendente
  return {
    pago,
    pendente,
    total,
    percentualPago: total > 0 ? (pago / total) * 100 : null,
  }
}

export function listarDespesasPendentes(despesas: Despesa[]): Despesa[] {
  return [...despesas]
    .filter((item) => !item.pago)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))
}

export function listarReceitasPendentes(receitas: Receita[]): Receita[] {
  return [...receitas]
    .filter((item) => !item.pago)
    .sort((a, b) => a.dataPagamento.localeCompare(b.dataPagamento))
}
