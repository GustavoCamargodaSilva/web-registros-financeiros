/**
 * Presets de largura para colunas do DataTable (desktop).
 * Usar percentuais dentro de uma mesma tabela para evitar mistura px + %.
 * Espelhado em tokens CSS (--table-col-*).
 */
export const TABLE_COL = {
  textPrimary: '20%',
  textSecondary: '15%',
  textTertiary: '13%',
  money: '10%',
  date: '11%',
  status: '10%',
  short: '8%',
  actions: '13%',
  /** Tabelas simples (ID + descrição + ações) */
  id: '10%',
  textFill: '75%',
  actionsCompact: '15%',
  /** Convites */
  memberName: '45%',
  memberRole: '30%',
  memberActions: '25%',
} as const

export type TableColumnPreset = keyof typeof TABLE_COL

export function columnWidth(preset: TableColumnPreset): string {
  return TABLE_COL[preset]
}

/** Despesas (8 colunas com ações) — soma 100% */
export const DESPESAS_TABLE_WIDTHS = {
  descricao: columnWidth('textPrimary'),
  valor: columnWidth('money'),
  vencimento: columnWidth('date'),
  responsavel: columnWidth('textSecondary'),
  cartao: columnWidth('textTertiary'),
  parcela: columnWidth('short'),
  status: columnWidth('status'),
  actions: columnWidth('actions'),
} as const

/** Receitas com coluna de ações — soma 100% */
export const RECEITAS_TABLE_WIDTHS = {
  pagador: '24%',
  responsavel: '18%',
  valor: '12%',
  dataPagamento: '16%',
  status: '12%',
  actions: '18%',
} as const

/** Despesas somente leitura (sem ações) — soma 100% */
export const DESPESAS_READONLY_TABLE_WIDTHS = {
  descricao: '22%',
  valor: '12%',
  vencimento: '13%',
  responsavel: '18%',
  cartao: '15%',
  parcela: '10%',
  status: '10%',
} as const

/** Receitas somente leitura (sem ações) — soma 100% */
export const RECEITAS_READONLY_TABLE_WIDTHS = {
  pagador: '28%',
  responsavel: '22%',
  valor: '16%',
  dataPagamento: '18%',
  status: '16%',
} as const
