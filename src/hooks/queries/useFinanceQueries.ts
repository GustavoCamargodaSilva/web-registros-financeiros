import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { ambientesApi } from '../../api/ambientes.api'
import { cartoesApi } from '../../api/cartoes.api'
import { categoriasApi } from '../../api/categorias.api'
import { despesasApi } from '../../api/despesas.api'
import { pagadoresApi } from '../../api/pagadores.api'
import { receitasApi } from '../../api/receitas.api'
import type { Despesa } from '../../types/despesa.types'
import type { ReceitaCompetenciaResponse } from '../../types/receita.types'
import type { SerieAnualTotais } from '../../types/serieAnual.types'
import type { Ambiente } from '../../types/ambiente.types'
import type { Categoria } from '../../types/categoria.types'
import type { Cartao } from '../../types/cartao.types'
import type { Pagador } from '../../types/pagador.types'
import type { MembroAmbiente } from '../../types/membro.types'
import { useApiFeedback } from '../useApiFeedback'
import { queryKeys } from './queryKeys'
import { useQueryErrorEffect } from './useQueryErrorEffect'

function useQueryWithFeedback<TData>(
  options: UseQueryOptions<TData, Error, TData, readonly unknown[]>,
) {
  const { handleError } = useApiFeedback()
  const query = useQuery(options)
  useQueryErrorEffect(query.error, handleError)
  return query
}

export function useAmbientesQuery() {
  return useQueryWithFeedback<Ambiente[]>({
    queryKey: queryKeys.ambientes.all,
    queryFn: () => ambientesApi.listar(),
  })
}

export function useCategoriasQuery() {
  return useQueryWithFeedback<Categoria[]>({
    queryKey: queryKeys.categorias.all,
    queryFn: () => categoriasApi.listar(),
  })
}

export function useCartoesQuery() {
  return useQueryWithFeedback<Cartao[]>({
    queryKey: queryKeys.cartoes.all,
    queryFn: () => cartoesApi.listar(),
  })
}

export function usePagadoresQuery() {
  return useQueryWithFeedback<Pagador[]>({
    queryKey: queryKeys.pagadores.all,
    queryFn: () => pagadoresApi.listar(),
  })
}

export function useMembrosAtivoQuery() {
  return useQueryWithFeedback<MembroAmbiente[]>({
    queryKey: queryKeys.membros.ativo,
    queryFn: () => ambientesApi.listarMembrosAtivo(),
  })
}

export function useDespesasCompetenciaQuery(ano: number, mes: number) {
  return useQueryWithFeedback<Despesa[]>({
    queryKey: queryKeys.despesas.competencia(ano, mes),
    queryFn: () => despesasApi.listarPorCompetencia(ano, mes),
  })
}

export function useReceitasCompetenciaQuery(ano: number, mes: number) {
  return useQueryWithFeedback<ReceitaCompetenciaResponse>({
    queryKey: queryKeys.receitas.competencia(ano, mes),
    queryFn: () => receitasApi.listarPorCompetencia(ano, mes),
  })
}

export function useDespesasTotaisAnuaisQuery(ano: number) {
  return useQueryWithFeedback<SerieAnualTotais>({
    queryKey: queryKeys.despesas.totaisAnuais(ano),
    queryFn: () => despesasApi.listarTotaisAnuais(ano),
  })
}

export function useReceitasTotaisAnuaisQuery(ano: number) {
  return useQueryWithFeedback<SerieAnualTotais>({
    queryKey: queryKeys.receitas.totaisAnuais(ano),
    queryFn: () => receitasApi.listarTotaisAnuais(ano),
  })
}
