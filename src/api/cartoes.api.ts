import { apiRequest } from './client'
import type { Cartao, CartaoRequest } from '../types/cartao.types'

const BASE = '/api/v1/cartoes'

export const cartoesApi = {
  listar: () => apiRequest<Cartao[]>(BASE),
  cadastrar: (data: CartaoRequest) =>
    apiRequest<void>(BASE, { method: 'POST', body: JSON.stringify(data) }),
  excluir: (id: number) => apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' }),
}
