import { describe, expect, it } from 'vitest'
import type { Receita } from '../types/receita.types'
import { calcularResumoReceitas } from './receitasResumo'

function receita(
  partial: Partial<Receita> & Pick<Receita, 'id' | 'valor'>,
): Receita {
  return {
    pagadorId: 1,
    pagadorDescricao: 'Empresa',
    pago: true,
    dataPagamento: '2026-07-15',
    ano: 2026,
    mes: 7,
    responsavelUsuarioId: null,
    responsavelNome: null,
    ...partial,
  }
}

describe('calcularResumoReceitas', () => {
  it('calcula total geral, por responsável e percentual 50/50', () => {
    const resumo = calcularResumoReceitas([
      receita({
        id: 1,
        valor: 100,
        responsavelUsuarioId: 1,
        responsavelNome: 'Ana',
      }),
      receita({
        id: 2,
        valor: 100,
        responsavelUsuarioId: 2,
        responsavelNome: 'Bruno',
      }),
    ])

    expect(resumo.totalGeral).toBe(200)
    expect(resumo.porResponsavel).toEqual([
      { usuarioId: 1, nome: 'Ana', total: 100, percentual: 50 },
      { usuarioId: 2, nome: 'Bruno', total: 100, percentual: 50 },
    ])
  })

  it('calcula percentual desproporcional', () => {
    const resumo = calcularResumoReceitas([
      receita({
        id: 1,
        valor: 1000,
        responsavelUsuarioId: 1,
        responsavelNome: 'Ana',
      }),
      receita({
        id: 2,
        valor: 500,
        responsavelUsuarioId: 1,
        responsavelNome: 'Ana',
      }),
      receita({
        id: 3,
        valor: 300,
        responsavelUsuarioId: 2,
        responsavelNome: 'Bruno',
      }),
    ])

    expect(resumo.totalGeral).toBe(1800)
    expect(resumo.porResponsavel).toEqual([
      { usuarioId: 1, nome: 'Ana', total: 1500, percentual: (1500 / 1800) * 100 },
      { usuarioId: 2, nome: 'Bruno', total: 300, percentual: (300 / 1800) * 100 },
    ])
  })

  it('uma pessoa só recebe 100%', () => {
    const resumo = calcularResumoReceitas([
      receita({
        id: 1,
        valor: 500,
        responsavelUsuarioId: 1,
        responsavelNome: 'Ana',
      }),
    ])

    expect(resumo.porResponsavel).toEqual([
      { usuarioId: 1, nome: 'Ana', total: 500, percentual: 100 },
    ])
  })

  it('retorna zeros para lista vazia', () => {
    expect(calcularResumoReceitas([])).toEqual({
      totalGeral: 0,
      porResponsavel: [],
    })
  })
})
