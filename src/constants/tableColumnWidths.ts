/**
 * Utilitários opcionais para `columnLayout="auto"` no DataTable.
 * O padrão do projeto é `columnLayout="equal"` (colunas com a mesma largura).
 */

/** Largura igual por coluna (ex.: 4 colunas → 25% cada). */
export function equalColumnWidth(columnCount: number): string {
  if (columnCount <= 0) {
    return '100%'
  }
  return `${100 / columnCount}%`
}

/** Presets legados — só usados com `columnLayout="auto"`. */
export const TABLE_COL = {
  textPrimary: '20%',
  textSecondary: '15%',
  money: '10%',
  date: '11%',
  status: '10%',
  actions: '13%',
} as const

export type TableColumnPreset = keyof typeof TABLE_COL

export function columnWidth(preset: TableColumnPreset): string {
  return TABLE_COL[preset]
}
