import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { ambienteStorage } from '../api/ambienteStorage'
import { ambientesApi } from '../api/ambientes.api'
import { convitesApi } from '../api/convites.api'
import { IconTrash } from '../components/layout/NavIcons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useApiFeedback } from '../hooks/useApiFeedback'
import type { Ambiente } from '../types/ambiente.types'
import type { MembroAmbiente } from '../types/membro.types'
import { TAG_CONVITE_EDICAO_DESPESAS } from '../types/convite.types'
import { primeiroNome } from '../utils/nome'
import styles from './pages.module.css'

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

function labelPapel(papel: string) {
  switch (papel) {
    case 'DONO':
      return 'Dono'
    case 'EDITOR':
      return 'Editor'
    case 'LEITOR':
      return 'Leitor'
    default:
      return papel
  }
}

export function ConvitesPage() {
  const { showSuccess, handleError } = useApiFeedback()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ambienteAtivo, setAmbienteAtivo] = useState<Ambiente | null>(null)
  const [membros, setMembros] = useState<MembroAmbiente[]>([])
  const [removeTarget, setRemoveTarget] = useState<MembroAmbiente | null>(null)
  const [removing, setRemoving] = useState(false)

  const isDono = ambienteAtivo?.papel === 'DONO'

  const loadData = useCallback(async () => {
    try {
      const [ambientes, membrosResponse] = await Promise.all([
        ambientesApi.listar(),
        ambientesApi.listarMembrosAtivo(),
      ])
      const ativo = resolverAmbienteAtivo(ambientes)
      setAmbienteAtivo(ativo)
      if (ativo && ambienteStorage.get() == null) {
        ambienteStorage.set(ativo.id)
      }
      setMembros(membrosResponse)
    } catch (error) {
      handleError(error)
    }
  }, [handleError])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = email.trim().toLowerCase()

    if (!trimmed) {
      setEmailError('E-mail é obrigatório')
      return
    }

    if (!trimmed.includes('@')) {
      setEmailError('E-mail inválido')
      return
    }

    if (!isDono) {
      setEmailError('Apenas o dono do ambiente pode enviar convites')
      return
    }

    setLoading(true)
    setEmailError('')

    try {
      const response = await convitesApi.convidar({
        tag: TAG_CONVITE_EDICAO_DESPESAS,
        to: [trimmed],
      })
      setEmail('')
      showSuccess(`Convite enviado para ${response.emailConvidado}`)
      await loadData()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const confirmRemove = async () => {
    if (!removeTarget) {
      return
    }

    setRemoving(true)
    try {
      await ambientesApi.removerMembro(removeTarget.usuarioId)
      showSuccess(`Acesso de ${primeiroNome(removeTarget.nome)} removido`)
      setRemoveTarget(null)
      await loadData()
    } catch (error) {
      handleError(error)
    } finally {
      setRemoving(false)
    }
  }

  if (ambienteAtivo && !isDono) {
    return <Navigate to="/despesas" replace />
  }

  return (
    <div className={styles.stack}>
      <Card title="Convidar para o ambiente">
        {ambienteAtivo ? (
          <p className={styles.toolbarMeta}>
            Ambiente: {ambienteAtivo.nome} · Seu papel: {labelPapel(ambienteAtivo.papel)}
          </p>
        ) : null}

        {!isDono ? (
          <p className={styles.editHint}>
            Apenas o dono do ambiente pode enviar convites. Você pode ver os membros abaixo.
          </p>
        ) : (
          <p className={styles.editHint}>
            Envie um convite por vez (um e-mail). O convidado receberá um link para aceitar e
            passará a editar despesas e receitas deste ambiente.
          </p>
        )}

        <form className={styles.form} onSubmit={(event) => void handleSubmit(event)}>
          <Input
            label="E-mail do convidado"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            error={emailError}
            hint="Apenas um destinatário por envio"
            disabled={!isDono || loading}
            onChange={(event) => {
              setEmail(event.target.value)
              if (emailError) {
                setEmailError('')
              }
            }}
          />
          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={!isDono || loading}>
              Enviar convite
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Membros do ambiente">
        <DataTable
          data={membros}
          emptyMessage="Nenhum membro neste ambiente."
          columns={[
            {
              key: 'nome',
              header: 'Nome',
              width: isDono ? '40%' : '50%',
              truncate: true,
              title: (row) => row.nome,
              render: (row) => primeiroNome(row.nome),
            },
            {
              key: 'papel',
              header: 'Papel',
              width: isDono ? '35%' : '50%',
              render: (row) => labelPapel(row.papel),
            },
            ...(isDono
              ? [
                  {
                    key: 'actions',
                    header: 'Ações',
                    width: '25%',
                    render: (row: MembroAmbiente) =>
                      row.papel === 'EDITOR' || row.papel === 'LEITOR' ? (
                        <div className={styles.tableActions}>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className={styles.actionDanger}
                            title="Remover acesso"
                            aria-label={`Remover acesso de ${primeiroNome(row.nome)}`}
                            onClick={() => setRemoveTarget(row)}
                          >
                            <IconTrash />
                          </Button>
                        </div>
                      ) : null,
                  },
                ]
              : []),
          ]}
        />
      </Card>

      <Modal
        open={Boolean(removeTarget)}
        title="Remover acesso"
        message={
          removeTarget
            ? `Deseja remover o acesso de ${primeiroNome(removeTarget.nome)} a este ambiente? As despesas e receitas já lançadas permanecerão.`
            : null
        }
        confirmLabel={removing ? 'Removendo…' : 'Remover acesso'}
        variant="danger"
        onCancel={() => {
          if (!removing) {
            setRemoveTarget(null)
          }
        }}
        onConfirm={() => {
          if (!removing) {
            void confirmRemove()
          }
        }}
      />
    </div>
  )
}
