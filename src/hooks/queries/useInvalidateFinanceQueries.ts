import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { queryKeys } from './queryKeys'

export function useInvalidateFinanceQueries() {
  const queryClient = useQueryClient()

  return {
    ambientes: useCallback(
      () => queryClient.invalidateQueries({ queryKey: queryKeys.ambientes.all }),
      [queryClient],
    ),
    categorias: useCallback(
      () => queryClient.invalidateQueries({ queryKey: queryKeys.categorias.all }),
      [queryClient],
    ),
    cartoes: useCallback(
      () => queryClient.invalidateQueries({ queryKey: queryKeys.cartoes.all }),
      [queryClient],
    ),
    pagadores: useCallback(
      () => queryClient.invalidateQueries({ queryKey: queryKeys.pagadores.all }),
      [queryClient],
    ),
    membros: useCallback(
      () => queryClient.invalidateQueries({ queryKey: queryKeys.membros.ativo }),
      [queryClient],
    ),
    despesas: useCallback(
      async (ano: number, mes: number) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.despesas.competencia(ano, mes) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.despesas.totaisAnuais(ano) }),
        ])
      },
      [queryClient],
    ),
    receitas: useCallback(
      async (ano: number, mes: number) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.receitas.competencia(ano, mes) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.receitas.totaisAnuais(ano) }),
        ])
      },
      [queryClient],
    ),
  }
}
