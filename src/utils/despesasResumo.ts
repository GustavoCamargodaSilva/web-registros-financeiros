import type { Despesa } from '../types/despesa.types'
import { primeiroNome } from './nome'

export interface TotalPorResponsavel {
  usuarioId: number
  nome: string
  total: number
}

export interface ResumoDespesas {
  totalGeral: number
  totalConjuntas: number
  porResponsavel: TotalPorResponsavel[]
}

export function calcularResumoDespesas(despesas: Despesa[]): ResumoDespesas {
  let totalGeral = 0
  let totalConjuntas = 0
  const totaisPorId = new Map<number, TotalPorResponsavel>()

  for (const despesa of despesas) {
    totalGeral += despesa.valor

    if (despesa.escopo === 'CONJUNTA') {
      totalConjuntas += despesa.valor
      continue
    }

    const usuarioId = despesa.responsavelUsuarioId
    if (usuarioId == null) {
      continue
    }

    const atual = totaisPorId.get(usuarioId)
    if (atual) {
      atual.total += despesa.valor
    } else {
      totaisPorId.set(usuarioId, {
        usuarioId,
        nome:
          primeiroNome(despesa.responsavelNome) === '—'
            ? `Usuário ${usuarioId}`
            : primeiroNome(despesa.responsavelNome),
        total: despesa.valor,
      })
    }
  }

  const porResponsavel = Array.from(totaisPorId.values())
    .filter((item) => item.total > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  return { totalGeral, totalConjuntas, porResponsavel }
}
