import type { GastoPorCategoria } from './homeGastosPorCategoria'

const DEMAIS_ID = -1

/**
 * Mantém no máximo `maxFatias` itens no donut: top (max-1) + "Demais…" se sobrar.
 */
export function limitarCategoriasParaDonut(
  itens: GastoPorCategoria[],
  maxFatias = 5,
): GastoPorCategoria[] {
  if (itens.length <= maxFatias) {
    return itens
  }

  const topCount = maxFatias - 1
  const principais = itens.slice(0, topCount)
  const demais = itens.slice(topCount)
  const totalDemais = demais.reduce((acc, item) => acc + item.total, 0)
  const totalGeral = itens.reduce((acc, item) => acc + item.total, 0)

  return [
    ...principais,
    {
      id: DEMAIS_ID,
      nome: 'Demais…',
      total: totalDemais,
      percentual: totalGeral > 0 ? (totalDemais / totalGeral) * 100 : 0,
    },
  ]
}
