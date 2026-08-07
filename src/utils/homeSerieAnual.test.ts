import { describe, expect, it } from 'vitest'
import {
  calcularVariacaoTotalAno,
  cortarSerieMensal,
  mesLimiteSerieAnual,
  montarPontosSerie,
  somarTotaisAteMes,
} from './homeSerieAnual'

const totais = [
  { mes: 1, total: 100 },
  { mes: 2, total: 200 },
  { mes: 3, total: 50 },
  { mes: 4, total: 0 },
  { mes: 5, total: 10 },
  { mes: 6, total: 0 },
  { mes: 7, total: 0 },
  { mes: 8, total: 0 },
  { mes: 9, total: 0 },
  { mes: 10, total: 0 },
  { mes: 11, total: 0 },
  { mes: 12, total: 0 },
]

describe('mesLimiteSerieAnual', () => {
  it('corta no mês atual quando o ano é o corrente', () => {
    expect(mesLimiteSerieAnual(2026, new Date(2026, 7, 15))).toBe(8)
  })

  it('mantém 12 meses para anos passados', () => {
    expect(mesLimiteSerieAnual(2025, new Date(2026, 7, 15))).toBe(12)
  })

  it('retorna 0 para anos futuros', () => {
    expect(mesLimiteSerieAnual(2027, new Date(2026, 7, 15))).toBe(0)
  })
})

describe('cortarSerieMensal / montarPontosSerie', () => {
  it('corta no mês limite', () => {
    expect(cortarSerieMensal(totais, 3).map((t) => t.mes)).toEqual([1, 2, 3])
  })

  it('monta labels curtos', () => {
    expect(montarPontosSerie(totais, 2)).toEqual([
      { mes: 1, label: 'JAN', total: 100 },
      { mes: 2, label: 'FEV', total: 200 },
    ])
  })
})

describe('somarTotaisAteMes', () => {
  it('soma até o mês limite', () => {
    expect(somarTotaisAteMes(totais, 3)).toBe(350)
  })
})

describe('calcularVariacaoTotalAno', () => {
  it('detecta alta e percentual', () => {
    expect(calcularVariacaoTotalAno(150, 100)).toEqual({
      totalAtual: 150,
      totalAnterior: 100,
      delta: 50,
      percentual: 50,
      direcao: 'alta',
    })
  })

  it('detecta baixa', () => {
    expect(calcularVariacaoTotalAno(80, 100).direcao).toBe('baixa')
  })

  it('estável quando ambos zero', () => {
    expect(calcularVariacaoTotalAno(0, 0)).toMatchObject({
      percentual: 0,
      direcao: 'estavel',
    })
  })

  it('indefinida quando anterior é zero e atual > 0', () => {
    expect(calcularVariacaoTotalAno(50, 0)).toMatchObject({
      percentual: null,
      direcao: 'indefinida',
    })
  })
})
