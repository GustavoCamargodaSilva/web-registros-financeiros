import { describe, expect, it } from 'vitest'
import type { Categoria } from '../types/categoria.types'
import type { Despesa } from '../types/despesa.types'
import { calcularGastosPorCategoria } from './homeGastosPorCategoria'

function despesa(partial: Partial<Despesa> & Pick<Despesa, 'id' | 'valor' | 'categoriaId'>): Despesa {
  return {
    descricao: 'Teste',
    vencimento: '2026-08-01',
    tipoDespesa: 'UNICA',
    pago: false,
    cartaoId: null,
    ano: 2026,
    mes: 8,
    escopo: 'INDIVIDUAL',
    responsavelUsuarioId: 1,
    responsavelNome: 'Ana',
    ...partial,
  }
}

describe('calcularGastosPorCategoria', () => {
  const categorias: Categoria[] = [
    { id: 1, descricao: 'Moradia' },
    { id: 2, descricao: 'Mercado' },
  ]

  it('agrupa totais e percentuais por categoria', () => {
    const resultado = calcularGastosPorCategoria(
      [
        despesa({ id: 1, valor: 1000, categoriaId: 1 }),
        despesa({ id: 2, valor: 500, categoriaId: 2 }),
        despesa({ id: 3, valor: 500, categoriaId: 1 }),
      ],
      categorias,
    )

    expect(resultado).toEqual([
      { id: 1, nome: 'Moradia', total: 1500, percentual: 75 },
      { id: 2, nome: 'Mercado', total: 500, percentual: 25 },
    ])
  })

  it('usa fallback quando a categoria não está na lista', () => {
    const resultado = calcularGastosPorCategoria(
      [despesa({ id: 1, valor: 100, categoriaId: 99 })],
      categorias,
    )
    expect(resultado[0]?.nome).toBe('Categoria 99')
  })
})
