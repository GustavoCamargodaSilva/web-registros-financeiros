import { describe, expect, it } from 'vitest'
import type { Despesa } from '../types/despesa.types'
import { filtrarDespesas } from './despesasFiltro'

function despesa(partial: Partial<Despesa> & Pick<Despesa, 'id' | 'escopo'>): Despesa {
  return {
    descricao: 'Teste',
    valor: 100,
    vencimento: '2026-07-01',
    tipoDespesa: 'FIXO',
    pago: false,
    categoriaId: 1,
    ano: 2026,
    mes: 7,
    responsavelUsuarioId: null,
    responsavelNome: null,
    ...partial,
  }
}

describe('filtrarDespesas', () => {
  const lista = [
    despesa({ id: 1, escopo: 'CONJUNTA' }),
    despesa({ id: 2, escopo: 'INDIVIDUAL', responsavelUsuarioId: 1, responsavelNome: 'Ana' }),
    despesa({ id: 3, escopo: 'INDIVIDUAL', responsavelUsuarioId: 2, responsavelNome: 'Bruno' }),
  ]

  it('retorna todas sem filtro', () => {
    expect(filtrarDespesas(lista, 'TODOS', null)).toHaveLength(3)
  })

  it('filtra só conjuntas', () => {
    expect(filtrarDespesas(lista, 'CONJUNTA', null).map((item) => item.id)).toEqual([1])
  })

  it('filtra só individuais', () => {
    expect(filtrarDespesas(lista, 'INDIVIDUAL', null).map((item) => item.id)).toEqual([2, 3])
  })

  it('filtra por responsável e ignora conjuntas', () => {
    expect(filtrarDespesas(lista, 'TODOS', 1).map((item) => item.id)).toEqual([2])
    expect(filtrarDespesas(lista, 'INDIVIDUAL', 2).map((item) => item.id)).toEqual([3])
  })
})
