export const queryKeys = {
  ambientes: {
    all: ['ambientes'] as const,
  },
  categorias: {
    all: ['categorias'] as const,
  },
  cartoes: {
    all: ['cartoes'] as const,
  },
  pagadores: {
    all: ['pagadores'] as const,
  },
  membros: {
    ativo: ['membros', 'ativo'] as const,
  },
  despesas: {
    competencia: (ano: number, mes: number) => ['despesas', ano, mes] as const,
    totaisAnuais: (ano: number) => ['despesas', 'totais-anuais', ano] as const,
    agregados: (ano: number, mes: number, groupBy: string) =>
      ['despesas', 'agregados', ano, mes, groupBy] as const,
  },
  receitas: {
    competencia: (ano: number, mes: number) => ['receitas', ano, mes] as const,
    totaisAnuais: (ano: number) => ['receitas', 'totais-anuais', ano] as const,
    agregados: (ano: number, mes: number, groupBy: string) =>
      ['receitas', 'agregados', ano, mes, groupBy] as const,
  },
  balanco: {
    serieAnual: (ano: number) => ['balanco', 'serie-anual', ano] as const,
  },
}
