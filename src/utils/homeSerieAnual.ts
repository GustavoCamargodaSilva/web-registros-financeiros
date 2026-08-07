import type { SerieAnualTotais, TotalMensal } from '../types/serieAnual.types'

export interface PontoSerieMensal {
  mes: number
  label: string
  total: number
}

export interface VariacaoTotalAno {
  totalAtual: number
  totalAnterior: number
  delta: number
  /** null quando totalAnterior === 0 e totalAtual > 0 (indefinido). */
  percentual: number | null
  direcao: 'alta' | 'baixa' | 'estavel' | 'indefinida'
}

const MESES_LABEL = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
] as const

/** Corta a série no mês atual quando o ano é o corrente; anos passados/futuros mantêm 1–12. */
export function mesLimiteSerieAnual(ano: number, agora: Date = new Date()): number {
  const anoAtual = agora.getFullYear()
  if (ano < anoAtual) return 12
  if (ano > anoAtual) return 0
  return agora.getMonth() + 1
}

export function cortarSerieMensal(
  totaisMensais: TotalMensal[],
  mesLimite: number,
): TotalMensal[] {
  if (mesLimite <= 0) return []
  return totaisMensais
    .filter((item) => item.mes >= 1 && item.mes <= mesLimite)
    .sort((a, b) => a.mes - b.mes)
}

export function somarTotaisAteMes(totaisMensais: TotalMensal[], mesLimite: number): number {
  return cortarSerieMensal(totaisMensais, mesLimite).reduce((acc, item) => acc + item.total, 0)
}

export function montarPontosSerie(
  totaisMensais: TotalMensal[],
  mesLimite: number,
): PontoSerieMensal[] {
  return cortarSerieMensal(totaisMensais, mesLimite).map((item) => ({
    mes: item.mes,
    label: MESES_LABEL[item.mes - 1] ?? String(item.mes),
    total: item.total,
  }))
}

export function calcularVariacaoTotalAno(
  totalAtual: number,
  totalAnterior: number,
): VariacaoTotalAno {
  const delta = totalAtual - totalAnterior
  let percentual: number | null
  let direcao: VariacaoTotalAno['direcao']

  if (totalAnterior === 0) {
    if (totalAtual === 0) {
      percentual = 0
      direcao = 'estavel'
    } else {
      percentual = null
      direcao = 'indefinida'
    }
  } else {
    percentual = (delta / totalAnterior) * 100
    if (Math.abs(delta) < 0.005) {
      direcao = 'estavel'
    } else if (delta > 0) {
      direcao = 'alta'
    } else {
      direcao = 'baixa'
    }
  }

  return { totalAtual, totalAnterior, delta, percentual, direcao }
}

export function serieVazia(ano: number): SerieAnualTotais {
  return {
    ano,
    totaisMensais: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 })),
    totalAno: 0,
  }
}
