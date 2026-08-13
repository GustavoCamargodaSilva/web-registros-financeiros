import { apiRequest } from './client'
import type { BalancoAnual } from '../types/balanco.types'

const BASE = '/api/v1/balanco'

export const balancoApi = {
  listarSerieAnual: (ano: number, pago?: boolean) => {
    const params = new URLSearchParams({ ano: String(ano) })
    if (pago !== undefined) {
      params.set('pago', String(pago))
    }
    return apiRequest<BalancoAnual>(`${BASE}/serie-anual?${params}`)
  },
}
