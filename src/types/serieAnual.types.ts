export interface TotalMensal {
  mes: number
  total: number
}

export interface SerieAnualTotais {
  ano: number
  totaisMensais: TotalMensal[]
  totalAno: number
}
