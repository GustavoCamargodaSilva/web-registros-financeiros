import { describe, expect, it } from 'vitest'
import type { Despesa } from '../types/despesa.types'
import { calcularResumoDespesas } from './despesasResumo'

function despesa(partial: Partial<Despesa> & Pick<Despesa, 'id' | 'escopo' | 'valor'>): Despesa {
  return {
    descricao: 'Teste',
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

describe('calcularResumoDespesas', () => {
  it('calcula total geral, conjuntas e por responsável', () => {
    const resumo = calcularResumoDespesas([
      despesa({ id: 1, escopo: 'CONJUNTA', valor: 200 }),
      despesa({ id: 2, escopo: 'INDIVIDUAL', valor: 100, responsavelUsuarioId: 1, responsavelNome: 'Ana' }),
      despesa({ id: 3, escopo: 'INDIVIDUAL', valor: 50, responsavelUsuarioId: 1, responsavelNome: 'Ana' }),
      despesa({ id: 4, escopo: 'INDIVIDUAL', valor: 300, responsavelUsuarioId: 2, responsavelNome: 'Bruno' }),
    ])

    expect(resumo.totalGeral).toBe(650)
    expect(resumo.totalConjuntas).toBe(200)
    expect(resumo.porResponsavel).toEqual([
      { usuarioId: 1, nome: 'Ana', total: 150 },
      { usuarioId: 2, nome: 'Bruno', total: 300 },
    ])
  })

  it('retorna zeros para lista vazia', () => {
    expect(calcularResumoDespesas([])).toEqual({
      totalGeral: 0,
      totalConjuntas: 0,
      porResponsavel: [],
    })
  })
})
