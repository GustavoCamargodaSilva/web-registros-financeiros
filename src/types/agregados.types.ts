export interface AgregadoItem {
  id: number | null
  chave: string
  total: number
  percentual: number
}

export interface AgregadosCompetencia {
  ano: number
  mes: number
  groupBy: string
  metrica: string
  totalGeral: number
  itens: AgregadoItem[]
}

export type AgrupamentoDespesa =
  | 'categoria'
  | 'cartao'
  | 'tipo'
  | 'escopo'
  | 'responsavel'
  | 'pago'

export type AgrupamentoReceita = 'pagador' | 'tipo' | 'responsavel' | 'pago'
