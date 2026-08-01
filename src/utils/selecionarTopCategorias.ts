import type { GastoPorCategoria } from './homeGastosPorCategoria'

/** Mantém as primeiras `n` categorias (já ordenadas maior → menor). */
export function selecionarTopCategorias(
  itens: GastoPorCategoria[],
  n = 5,
): GastoPorCategoria[] {
  return itens.slice(0, n)
}
