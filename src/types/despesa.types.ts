export type TipoDespesa = 'UNICA' | 'FIXO' | 'VARIAVEL'

export type EscopoDespesa = 'INDIVIDUAL' | 'CONJUNTA'

export interface Despesa {
  id: number
  descricao: string
  valor: number
  vencimento: string
  tipoDespesa: TipoDespesa
  pago: boolean
  categoriaId: number
  cartaoId: number
  cartaoNome?: string
  ano: number
  mes: number
  numeroParcela?: number
  totalParcelas?: number
  grupoParcelamento?: string
  escopo: EscopoDespesa
  responsavelUsuarioId?: number | null
  responsavelNome?: string | null
}

export interface DespesaRequest {
  descricao: string
  valor: number
  vencimento: string
  tipoDespesa: TipoDespesa
  pago: boolean
  categoriaId: number
  cartaoId: number
  quantidadeParcelas?: number
  escopo: EscopoDespesa
  responsavelUsuarioId?: number | null
}

export interface DespesaUpdateRequest {
  descricao: string
  valor: number
  vencimento: string
  pago: boolean
  categoriaId: number
  cartaoId: number
  escopo: EscopoDespesa
  responsavelUsuarioId?: number | null
}
