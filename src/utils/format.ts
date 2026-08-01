const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value)
}

/** Exibe percentual com até 1 casa decimal (pt-BR). */
export function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`
}

/**
 * Tick de eixo em escala compacta pt-BR: `800`, `1 mil`, `1,2 mil`.
 * Não usa moeda — só para eixos de gráfico.
 */
export function formatEixoCompacto(valor: number): string {
  const abs = Math.abs(valor)
  if (abs < 1000) {
    return Math.round(valor).toLocaleString('pt-BR')
  }

  const milhares = valor / 1000
  const formatted = milhares.toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })
  return `${formatted} mil`
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function formatCompetencia(ano: number, mes: number): string {
  const date = new Date(ano, mes - 1, 1)
  const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

export const MESES_CURTOS = [
  { value: 1, label: 'JAN' },
  { value: 2, label: 'FEV' },
  { value: 3, label: 'MAR' },
  { value: 4, label: 'ABR' },
  { value: 5, label: 'MAI' },
  { value: 6, label: 'JUN' },
  { value: 7, label: 'JUL' },
  { value: 8, label: 'AGO' },
  { value: 9, label: 'SET' },
  { value: 10, label: 'OUT' },
  { value: 11, label: 'NOV' },
  { value: 12, label: 'DEZ' },
]
