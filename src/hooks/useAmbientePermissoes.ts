import { useCallback, useEffect, useState } from 'react'
import { ambienteStorage } from '../api/ambienteStorage'
import { ambientesApi } from '../api/ambientes.api'
import type { Ambiente } from '../types/ambiente.types'
import type { PapelMembro } from '../types/membro.types'
import { useApiFeedback } from './useApiFeedback'

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

export function useAmbientePermissoes(): AmbientePermissoes {
  const { handleError } = useApiFeedback()
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      const ambientes = await ambientesApi.listar()
      const ativo = resolverAmbienteAtivo(ambientes)
      setAmbiente(ativo)
      if (ativo && ambienteStorage.get() == null) {
        ambienteStorage.set(ativo.id)
      }
    } catch (error) {
      handleError(error)
      setAmbiente(null)
    } finally {
      setLoading(false)
    }
  }, [handleError])

  useEffect(() => {
    void reload()
  }, [reload])

  const papel = ambiente?.papel ?? null
  const canWrite = papel === 'DONO' || papel === 'EDITOR'
  const canManageMembros = papel === 'DONO'

  return { ambiente, papel, canWrite, canManageMembros, loading, reload }
}
