import { apiRequest } from './client'
import type { Pagador, PagadorRequest } from '../types/pagador.types'

const BASE = '/api/v1/pagadores'

export const pagadoresApi = {
  listar: () => apiRequest<Pagador[]>(BASE),
  cadastrar: (data: PagadorRequest) =>
    apiRequest<void>(BASE, { method: 'POST', body: JSON.stringify(data) }),
  excluir: (id: number) => apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' }),
}
