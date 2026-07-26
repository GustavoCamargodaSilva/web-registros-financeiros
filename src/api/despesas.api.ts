import { apiRequest } from './client'
import type { Despesa, DespesaRequest, DespesaUpdateRequest } from '../types/despesa.types'

const BASE = '/api/v1/despesas'

export const despesasApi = {
  listarPorCompetencia: (ano: number, mes: number) =>
    apiRequest<Despesa[]>(`${BASE}?ano=${ano}&mes=${mes}`),
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
