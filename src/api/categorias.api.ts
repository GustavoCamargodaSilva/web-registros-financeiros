import { apiRequest } from './client'
import type { Categoria, CategoriaRequest } from '../types/categoria.types'

const BASE = '/api/v1/categorias'

export const categoriasApi = {
  listar: () => apiRequest<Categoria[]>(BASE),
  cadastrar: (data: CategoriaRequest) =>
    apiRequest<void>(BASE, { method: 'POST', body: JSON.stringify(data) }),
  excluir: (id: number) => apiRequest<void>(`${BASE}/${id}`, { method: 'DELETE' }),
}
