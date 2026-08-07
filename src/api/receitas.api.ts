import { apiRequest } from './client'
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
  listarTotaisAnuais: (ano: number) =>
    apiRequest<SerieAnualTotais>(`${BASE}/totais-anuais?ano=${ano}`),
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
