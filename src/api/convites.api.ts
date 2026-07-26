import type {
  AceitarConviteResponse,
  ConviteEdicaoRequest,
  ConviteEdicaoResponse,
} from '../types/convite.types'
import { apiRequest } from './client'

const BASE = '/api/v1/convites'

export const convitesApi = {
  aceitar: (token: string) =>
    apiRequest<AceitarConviteResponse>(`${BASE}/${encodeURIComponent(token)}/aceitar`, {
      method: 'POST',
    }),
  convidar: (data: ConviteEdicaoRequest) =>
    apiRequest<ConviteEdicaoResponse>(`${BASE}/edicao-despesas`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}
