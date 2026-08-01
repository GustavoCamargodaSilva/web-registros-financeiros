import { describe, expect, it } from 'vitest'
import type { GastoPorCategoria } from './homeGastosPorCategoria'
import { limitarCategoriasParaDonut } from './limitarCategoriasParaDonut'

function item(id: number, nome: string, total: number, percentual: number): GastoPorCategoria {
  return { id, nome, total, percentual }
}

describe('limitarCategoriasParaDonut', () => {
  it('não altera quando há até 5 itens', () => {
    const itens = [
      item(1, 'A', 100, 50),
      item(2, 'B', 100, 50),
    ]
    expect(limitarCategoriasParaDonut(itens)).toEqual(itens)
  })

  it('agrega o restante em Demais…', () => {
    const itens = [
      item(1, 'A', 400, 40),
      item(2, 'B', 200, 20),
      item(3, 'C', 150, 15),
      item(4, 'D', 100, 10),
      item(5, 'E', 80, 8),
      item(6, 'F', 70, 7),
    ]
    const resultado = limitarCategoriasParaDonut(itens, 5)
    expect(resultado).toHaveLength(5)
    expect(resultado.slice(0, 4).map((entry) => entry.nome)).toEqual(['A', 'B', 'C', 'D'])
    expect(resultado[4]).toMatchObject({
      id: -1,
      nome: 'Demais…',
      total: 150,
      percentual: 15,
    })
  })
})
