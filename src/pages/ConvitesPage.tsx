import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { ambientesApi } from '../api/ambientes.api'
import { convitesApi } from '../api/convites.api'
import { IconTrash } from '../components/layout/NavIcons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAmbientePermissoes } from '../hooks/useAmbientePermissoes'
import { useApiFeedback } from '../hooks/useApiFeedback'
import { useMembrosAtivoQuery } from '../hooks/queries/useFinanceQueries'
import { useInvalidateFinanceQueries } from '../hooks/queries/useInvalidateFinanceQueries'
import type { MembroAmbiente } from '../types/membro.types'
import { TAG_CONVITE_EDICAO_DESPESAS } from '../types/convite.types'
import { primeiroNome } from '../utils/nome'
import styles from './pages.module.css'

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
  const { ambiente: ambienteAtivo, canManageMembros, loading: ambienteLoading } =
    useAmbientePermissoes()
  const invalidate = useInvalidateFinanceQueries()
  const membrosQuery = useMembrosAtivoQuery()
  const membros = membrosQuery.data ?? []
  const listLoading = ambienteLoading || membrosQuery.isPending

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<MembroAmbiente | null>(null)
  const [removing, setRemoving] = useState(false)

  const isDono = canManageMembros

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
      showSuccess(
        `Convite registrado para ${response.emailConvidado}. O e-mail será enviado em instantes.`,
      )
      await invalidate.membros()
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
      await invalidate.membros()
    } catch (error) {
      handleError(error)
    } finally {
      setRemoving(false)
    }
  }

  if (!listLoading && ambienteAtivo && !isDono) {
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
            Envie um convite por vez (um e-mail). O convite é registrado na hora; o link de aceite
            chega por e-mail em instantes e concede acesso para editar despesas e receitas.
          </p>
        )}

        <form
          className={`${styles.form} ${styles.formNarrow}`}
          onSubmit={(event) => void handleSubmit(event)}
        >
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
            <Button type="submit" variant="primary" loading={loading} disabled={!isDono}>
              Enviar convite
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Membros do ambiente">
        <DataTable
          data={membros}
          loading={listLoading}
          emptyMessage="Nenhum membro neste ambiente."
          columns={[
            {
              key: 'nome',
              header: 'Nome',
              width: isDono ? '40%' : '50%',
              truncate: true,
              priority: 'primary',
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
                    priority: 'actions' as const,
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
