export type TipoReceita = 'FIXO' | 'VARIAVEL'

export interface Receita {
  id: number
  pagadorId: number
  pagadorDescricao: string
  valor: number
  pago: boolean
  dataPagamento: string
  ano: number
  mes: number
  tipoReceita: TipoReceita
  grupoRecorrencia?: string | null
  responsavelUsuarioId?: number | null
  responsavelNome?: string | null
}

export interface ReceitaRequest {
  pagadorId: number
  valor: number
  pago: boolean
  dataPagamento: string
  tipoReceita: TipoReceita
  responsavelUsuarioId?: number | null
}

export interface ReceitaUpdateRequest {
  pagadorId: number
  valor: number
  pago: boolean
  dataPagamento: string
  responsavelUsuarioId?: number | null
}

export interface ReceitaCompetenciaResponse {
  ano: number
  mes: number
  valorTotal: number
  receitas: Receita[]
}
