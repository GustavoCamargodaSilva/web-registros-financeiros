import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { pagadoresApi } from '../api/pagadores.api'
import { IconTrash } from '../components/layout/NavIcons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAmbientePermissoes } from '../hooks/useAmbientePermissoes'
import { useApiFeedback } from '../hooks/useApiFeedback'
import type { Pagador } from '../types/pagador.types'
import styles from './pages.module.css'

export function PagadoresPage() {
  const { showSuccess, handleError } = useApiFeedback()
  const { canWrite } = useAmbientePermissoes()
  const [pagadores, setPagadores] = useState<Pagador[]>([])
  const [descricao, setDescricao] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Pagador | null>(null)

  const loadPagadores = useCallback(async () => {
    try {
      setPagadores(await pagadoresApi.listar())
    } catch (error) {
      handleError(error)
    }
  }, [handleError])

  useEffect(() => {
    void loadPagadores()
  }, [loadPagadores])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) {
      return
    }
    const trimmed = descricao.trim()

    if (!trimmed) {
      setError('Descrição é obrigatória')
      return
    }

    if (trimmed.length > 30) {
      setError('Descrição não pode ter mais de 30 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      await pagadoresApi.cadastrar({ descricao: trimmed })
      setDescricao('')
      showSuccess('Pagador cadastrado com sucesso')
      await loadPagadores()
    } catch (submitError) {
      handleError(submitError)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !canWrite) {
      return
    }

    try {
      await pagadoresApi.excluir(deleteTarget.id)
      showSuccess('Pagador excluído com sucesso')
      setDeleteTarget(null)
      await loadPagadores()
    } catch (deleteError) {
      handleError(deleteError)
    }
  }

  const columns: DataTableColumn<Pagador>[] = [
    { key: 'id', header: 'ID', hideOnMobile: true, render: (row: Pagador) => row.id },
    {
      key: 'descricao',
      header: 'Descrição',
      priority: 'primary',
      render: (row: Pagador) => row.descricao,
    },
    ...(canWrite
      ? [
          {
            key: 'actions',
            header: 'Ações',
            priority: 'actions' as const,
            render: (row: Pagador) => (
              <div className={styles.tableActions}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={styles.actionDanger}
                  title="Excluir"
                  aria-label="Excluir"
                  onClick={() => setDeleteTarget(row)}
                >
                  <IconTrash />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ]

  return (
    <div className={styles.stack}>
      {canWrite ? (
        <Card title="Novo pagador">
          <form className={`${styles.form} ${styles.formNarrow}`} onSubmit={handleSubmit}>
            <Input
              label="Descrição"
              name="descricao"
              value={descricao}
              maxLength={30}
              error={error}
              onChange={(event) => setDescricao(event.target.value)}
            />
            <div className={styles.actions}>
              <Button type="submit" disabled={loading}>
                Cadastrar
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <p className={styles.editHint}>Seu papel neste ambiente é somente leitura.</p>
      )}

      <Card title="Pagadores cadastrados">
        <DataTable data={pagadores} columns={columns} />
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        title="Excluir pagador"
        message={`Deseja excluir "${deleteTarget?.descricao}"?`}
        confirmLabel="Excluir"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
