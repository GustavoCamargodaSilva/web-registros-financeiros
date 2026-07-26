export type StatusAceiteConvite = 'accepted' | 'already_member' | string

export interface AceitarConviteResponse {
  status: StatusAceiteConvite
  ambienteId: number
  ambienteNome: string
  papel: string
}

export const TAG_CONVITE_EDICAO_DESPESAS = 'CONVITE_EDICAO_DESPESAS'

export interface ConviteEdicaoRequest {
  tag: string
  to: string[]
}

export interface ConviteEdicaoResponse {
  status: string
  emailConvidado: string
  tag: string
  ambienteId: number
}
