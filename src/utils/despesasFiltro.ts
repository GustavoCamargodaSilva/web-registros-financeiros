import type { Despesa, EscopoDespesa } from '../types/despesa.types'

export type FiltroEscopoDespesa = 'TODOS' | EscopoDespesa

export function filtrarDespesas(
  despesas: Despesa[],
  filtroEscopo: FiltroEscopoDespesa,
  filtroResponsavelId: number | null,
): Despesa[] {
  return despesas.filter((despesa) => {
    if (filtroEscopo !== 'TODOS' && despesa.escopo !== filtroEscopo) {
      return false
    }

    if (filtroResponsavelId != null) {
      if (despesa.escopo !== 'INDIVIDUAL') {
        return false
      }
      return despesa.responsavelUsuarioId === filtroResponsavelId
    }

    return true
  })
}
