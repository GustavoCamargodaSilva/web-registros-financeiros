import { describe, expect, it } from 'vitest'
import type { Despesa } from '../types/despesa.types'
import type { Receita } from '../types/receita.types'
import { calcularBalancoMes } from './homeBalanco'

function receita(partial: Partial<Receita> & Pick<Receita, 'id' | 'valor'>): Receita {
  return {
    pagadorId: 1,
    pagadorDescricao: 'Empresa',
    pago: true,
    dataPagamento: '2026-08-01',
    ano: 2026,
    mes: 8,
    tipoReceita: 'VARIAVEL',
    ...partial,
  }
}

function despesa(partial: Partial<Despesa> & Pick<Despesa, 'id' | 'valor' | 'escopo'>): Despesa {
  return {
    descricao: 'Teste',
    vencimento: '2026-08-01',
    tipoDespesa: 'UNICA',
    pago: false,
    categoriaId: 1,
    cartaoId: null,
    ano: 2026,
    mes: 8,
    responsavelUsuarioId: null,
    responsavelNome: null,
    ...partial,
  }
}

describe('calcularBalancoMes', () => {
  it('soma entradas e saídas do mês', () => {
    const balanco = calcularBalancoMes(
      [receita({ id: 1, valor: 3000 }), receita({ id: 2, valor: 500 })],
      [
        despesa({ id: 1, valor: 1000, escopo: 'CONJUNTA' }),
        despesa({ id: 2, valor: 200, escopo: 'INDIVIDUAL', responsavelUsuarioId: 1 }),
      ],
    )

    expect(balanco.totalEntradas).toBe(3500)
    expect(balanco.totalSaidas).toBe(1200)
  })

  it('retorna zeros sem lançamentos', () => {
    expect(calcularBalancoMes([], [])).toEqual({ totalEntradas: 0, totalSaidas: 0 })
  })
})
