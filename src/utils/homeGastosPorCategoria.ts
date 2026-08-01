import type { Categoria } from '../types/categoria.types'
import type { Despesa } from '../types/despesa.types'

export interface GastoPorCategoria {
  id: number
  nome: string
  total: number
  percentual: number
}

export function calcularGastosPorCategoria(
  despesas: Despesa[],
  categorias: Categoria[],
): GastoPorCategoria[] {
  const nomes = new Map(categorias.map((categoria) => [categoria.id, categoria.descricao]))
  const totais = new Map<number, number>()
  let totalGeral = 0

  for (const despesa of despesas) {
    totalGeral += despesa.valor
    totais.set(despesa.categoriaId, (totais.get(despesa.categoriaId) ?? 0) + despesa.valor)
  }

  return Array.from(totais.entries())
    .map(([id, total]) => ({
      id,
      nome: nomes.get(id) ?? `Categoria ${id}`,
      total,
      percentual: totalGeral > 0 ? (total / totalGeral) * 100 : 0,
    }))
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
}
