import { apiRequest } from './client'
import type { AgrupamentoReceita, AgregadosCompetencia } from '../types/agregados.types'
import type {
  Receita,
  ReceitaCompetenciaResponse,
  ReceitaRequest,
  ReceitaUpdateRequest,
} from '../types/receita.types'
import type { SerieAnualTotais } from '../types/serieAnual.types'

const BASE = '/api/v1/receitas'

export const receitasApi = {
  listarPorCompetencia: (ano: number, mes: number) =>
    apiRequest<ReceitaCompetenciaResponse>(`${BASE}?ano=${ano}&mes=${mes}`),
  listarTotaisAnuais: (ano: number, pago?: boolean) => {
    const params = new URLSearchParams({ ano: String(ano) })
    if (pago !== undefined) {
      params.set('pago', String(pago))
    }
    return apiRequest<SerieAnualTotais>(`${BASE}/totais-anuais?${params}`)
  },
  listarAgregados: (ano: number, mes: number, groupBy: AgrupamentoReceita) =>
    apiRequest<AgregadosCompetencia>(
      `${BASE}/agregados?ano=${ano}&mes=${mes}&groupBy=${groupBy}`,
    ),
  cadastrar: (data: ReceitaRequest) =>
    apiRequest<void>(BASE, { method: 'POST', body: JSON.stringify(data) }),
  atualizar: (id: number, data: ReceitaUpdateRequest) =>
    apiRequest<Receita>(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  atualizarPago: (id: number, pago: boolean) =>
    apiRequest<Receita>(`${BASE}/${id}/pago`, {
      method: 'PATCH',
      body: JSON.stringify({ pago }),
    }),
  excluir: (id: number) => apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' }),
}
