import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ambientesApi } from '../api/ambientes.api'
import { ToastProvider } from '../components/toast/ToastProvider'
import { withQueryClient } from '../test/queryWrapper'
import { AmbienteProvider, useAmbientePermissoes } from './AmbienteContext'

vi.mock('../api/ambientes.api', () => ({
  ambientesApi: {
    listar: vi.fn().mockResolvedValue([
      { id: 1, nome: 'Casa', papel: 'DONO' },
    ]),
  },
}))

function Probe() {
  const { canWrite, canManageMembros, loading, ambiente } = useAmbientePermissoes()
  if (loading) {
    return <p>carregando-permissoes</p>
  }
  return (
    <p>
      {ambiente?.nome}:{canWrite ? 'write' : 'ro'}:{canManageMembros ? 'manage' : 'nomembers'}
    </p>
  )
}

describe('AmbienteProvider', () => {
  it('compartilha um único carregamento de ambientes com os consumidores', async () => {
    render(
      withQueryClient(
        <ToastProvider>
          <AmbienteProvider>
            <Probe />
            <Probe />
          </AmbienteProvider>
        </ToastProvider>,
      ),
    )

    expect(screen.getAllByText('carregando-permissoes')).toHaveLength(2)

    await waitFor(() => {
      expect(screen.getAllByText('Casa:write:manage')).toHaveLength(2)
    })

    expect(ambientesApi.listar).toHaveBeenCalledTimes(1)
  })
})
