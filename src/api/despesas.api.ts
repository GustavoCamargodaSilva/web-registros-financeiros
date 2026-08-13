import { apiRequest } from './client'
import type { AgrupamentoDespesa, AgregadosCompetencia } from '../types/agregados.types'
import type { Despesa, DespesaRequest, DespesaUpdateRequest } from '../types/despesa.types'
import type { SerieAnualTotais } from '../types/serieAnual.types'

const BASE = '/api/v1/despesas'

export const despesasApi = {
  listarPorCompetencia: (ano: number, mes: number) =>
    apiRequest<Despesa[]>(`${BASE}?ano=${ano}&mes=${mes}`),
  listarTotaisAnuais: (ano: number, pago?: boolean) => {
    const params = new URLSearchParams({ ano: String(ano) })
    if (pago !== undefined) {
      params.set('pago', String(pago))
    }
    return apiRequest<SerieAnualTotais>(`${BASE}/totais-anuais?${params}`)
  },
  listarAgregados: (ano: number, mes: number, groupBy: AgrupamentoDespesa) =>
    apiRequest<AgregadosCompetencia>(
      `${BASE}/agregados?ano=${ano}&mes=${mes}&groupBy=${groupBy}`,
    ),
  cadastrar: (data: DespesaRequest) =>
    apiRequest<void>(BASE, { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number, data: DespesaUpdateRequest) =>
    apiRequest<Despesa>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  atualizarPago: (id: number, pago: boolean) =>
    apiRequest<Despesa>(`${BASE}/${id}/pago`, {
      method: 'PATCH',
      body: JSON.stringify({ pago }),
    }),
  excluir: (id: number) => apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' }),
}
