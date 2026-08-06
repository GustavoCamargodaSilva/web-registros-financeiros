import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ambienteStorage } from '../api/ambienteStorage'
import { useAmbientesQuery } from '../hooks/queries/useFinanceQueries'
import { queryKeys } from '../hooks/queries/queryKeys'
import type { Ambiente } from '../types/ambiente.types'
import type { PapelMembro } from '../types/membro.types'

function resolverAmbienteAtivo(ambientes: Ambiente[]): Ambiente | null {
  if (ambientes.length === 0) {
    return null
  }
  const armazenado = ambienteStorage.get()
  if (armazenado != null) {
    const encontrado = ambientes.find((item) => item.id === armazenado)
    if (encontrado) {
      return encontrado
    }
  }
  return ambientes.find((item) => item.papel === 'DONO') ?? ambientes[0]
}

export interface AmbientePermissoes {
  ambiente: Ambiente | null
  papel: PapelMembro | null
  /** DONO ou EDITOR — pode criar/editar/excluir registros financeiros */
  canWrite: boolean
  /** Somente DONO — convites e remoção de membros */
  canManageMembros: boolean
  loading: boolean
  reload: () => Promise<void>
}

const AmbienteContext = createContext<AmbientePermissoes | null>(null)

export function AmbienteProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const ambientesQuery = useAmbientesQuery()

  const ambiente = useMemo(
    () => (ambientesQuery.data ? resolverAmbienteAtivo(ambientesQuery.data) : null),
    [ambientesQuery.data],
  )

  useEffect(() => {
    if (ambiente && ambienteStorage.get() == null) {
      ambienteStorage.set(ambiente.id)
    }
  }, [ambiente])

  const reload = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.ambientes.all })
  }, [queryClient])

  const papel = ambiente?.papel ?? null
  const canWrite = papel === 'DONO' || papel === 'EDITOR'
  const canManageMembros = papel === 'DONO'

  const value = useMemo(
    () => ({
      ambiente,
      papel,
      canWrite,
      canManageMembros,
      loading: ambientesQuery.isPending,
      reload,
    }),
    [ambiente, papel, canWrite, canManageMembros, ambientesQuery.isPending, reload],
  )

  return <AmbienteContext.Provider value={value}>{children}</AmbienteContext.Provider>
}

export function useAmbientePermissoes(): AmbientePermissoes {
  const context = useContext(AmbienteContext)
  if (!context) {
    throw new Error('useAmbientePermissoes deve ser usado dentro de AmbienteProvider')
  }
  return context
}
