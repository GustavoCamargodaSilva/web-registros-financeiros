import { apiRequest } from './client'
import type { Ambiente } from '../types/ambiente.types'
import type { MembroAmbiente } from '../types/membro.types'

const BASE = '/api/v1/ambientes'

export const ambientesApi = {
  listar: () => apiRequest<Ambiente[]>(BASE),
  listarMembrosAtivo: () => apiRequest<MembroAmbiente[]>(`${BASE}/ativo/membros`),
}
