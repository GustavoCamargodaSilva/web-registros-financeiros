export interface BalancoMensal {
  mes: number
  receitas: number
  despesas: number
  saldo: number
}

export interface BalancoAnual {
  ano: number
  metrica: string
  meses: BalancoMensal[]
  totalReceitasAno: number
  totalDespesasAno: number
  saldoAno: number
}
