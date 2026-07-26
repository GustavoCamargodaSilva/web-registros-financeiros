import type { Receita } from '../types/receita.types'
import { primeiroNome } from './nome'

export interface TotalPorResponsavelReceita {
  usuarioId: number
  nome: string
  total: number
  /** Participação no total geral (0–100). */
  percentual: number
}

export interface ResumoReceitas {
  totalGeral: number
  porResponsavel: TotalPorResponsavelReceita[]
}

function calcularPercentual(total: number, totalGeral: number): number {
  if (totalGeral <= 0) {
    return 0
  }
  return (total / totalGeral) * 100
}

export function calcularResumoReceitas(receitas: Receita[]): ResumoReceitas {
  let totalGeral = 0
  const totaisPorId = new Map<number, Omit<TotalPorResponsavelReceita, 'percentual'>>()

  for (const receita of receitas) {
    totalGeral += receita.valor

    const usuarioId = receita.responsavelUsuarioId
    if (usuarioId == null) {
      continue
    }

    const atual = totaisPorId.get(usuarioId)
    if (atual) {
      atual.total += receita.valor
    } else {
      totaisPorId.set(usuarioId, {
        usuarioId,
        nome:
          primeiroNome(receita.responsavelNome) === '—'
            ? `Usuário ${usuarioId}`
            : primeiroNome(receita.responsavelNome),
        total: receita.valor,
      })
    }
  }

  const porResponsavel = Array.from(totaisPorId.values())
    .filter((item) => item.total > 0)
    .map((item) => ({
      ...item,
      percentual: calcularPercentual(item.total, totalGeral),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  return { totalGeral, porResponsavel }
}
