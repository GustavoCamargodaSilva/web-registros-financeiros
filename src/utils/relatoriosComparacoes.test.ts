import { describe, expect, it } from 'vitest'
import {
  competenciaAnterior,
  compararValores,
  cruzarAgregadosComMoM,
  listarDespesasPendentes,
  resumirPagoPendente,
} from './relatoriosComparacoes'
import type { Despesa } from '../types/despesa.types'

describe('competenciaAnterior', () => {
  it('decrementa o mês', () => {
    expect(competenciaAnterior(2026, 8)).toEqual({ ano: 2026, mes: 7 })
  })

  it('volta para dezembro do ano anterior em janeiro', () => {
    expect(competenciaAnterior(2026, 1)).toEqual({ ano: 2025, mes: 12 })
  })
})

describe('compararValores', () => {
  it('marca indefinida quando base é zero e atual > 0', () => {
    expect(compararValores(100, 0).direcao).toBe('indefinida')
  })

  it('calcula queda percentual', () => {
    const v = compararValores(80, 100)
    expect(v.direcao).toBe('baixa')
    expect(v.percentual).toBe(-20)
  })
})

describe('cruzarAgregadosComMoM', () => {
  it('cruza pelo id quando disponível', () => {
    const result = cruzarAgregadosComMoM(
      [{ id: 1, chave: 'Moradia', total: 120, percentual: 60 }],
      [{ id: 1, chave: 'Moradia', total: 100, percentual: 50 }],
    )
    expect(result[0].mom.delta).toBe(20)
    expect(result[0].mom.direcao).toBe('alta')
  })
})

describe('resumirPagoPendente', () => {
  it('calcula percentual pago', () => {
    const r = resumirPagoPendente([
      { pago: true, valor: 75 },
      { pago: false, valor: 25 },
    ])
    expect(r.percentualPago).toBe(75)
  })
})

describe('listarDespesasPendentes', () => {
  it('filtra e ordena por vencimento', () => {
    const despesas = [
      { id: 2, pago: false, vencimento: '2026-08-20', valor: 10 },
      { id: 1, pago: true, vencimento: '2026-08-01', valor: 10 },
      { id: 3, pago: false, vencimento: '2026-08-05', valor: 10 },
    ] as Despesa[]
    expect(listarDespesasPendentes(despesas).map((d) => d.id)).toEqual([3, 2])
  })
})
