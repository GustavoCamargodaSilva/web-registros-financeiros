import { describe, expect, it } from 'vitest'
import type { GastoPorCategoria } from './homeGastosPorCategoria'
import { selecionarTopCategorias } from './selecionarTopCategorias'

function item(id: number, nome: string, total: number, percentual: number): GastoPorCategoria {
  return { id, nome, total, percentual }
}

describe('selecionarTopCategorias', () => {
  it('retorna os primeiros N itens', () => {
    const itens = [
      item(1, 'A', 400, 40),
      item(2, 'B', 200, 20),
      item(3, 'C', 150, 15),
      item(4, 'D', 100, 10),
      item(5, 'E', 80, 8),
      item(6, 'F', 70, 7),
    ]
    const resultado = selecionarTopCategorias(itens, 5)
    expect(resultado).toHaveLength(5)
    expect(resultado.map((entry) => entry.nome)).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('retorna todos quando há menos que N', () => {
    const itens = [item(1, 'A', 100, 50), item(2, 'B', 100, 50)]
    expect(selecionarTopCategorias(itens)).toEqual(itens)
  })

  it('usa N=5 por padrão', () => {
    const itens = Array.from({ length: 8 }, (_, i) =>
      item(i + 1, `Cat ${i + 1}`, 100 - i, 10),
    )
    expect(selecionarTopCategorias(itens)).toHaveLength(5)
  })
})
