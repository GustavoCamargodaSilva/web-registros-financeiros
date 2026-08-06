import { useMemo, useState, type FormEvent } from 'react'
import { pagadoresApi } from '../api/pagadores.api'
import { IconTrash } from '../components/layout/NavIcons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAmbientePermissoes } from '../hooks/useAmbientePermissoes'
import { useApiFeedback } from '../hooks/useApiFeedback'
import { usePagadoresQuery } from '../hooks/queries/useFinanceQueries'
import { useInvalidateFinanceQueries } from '../hooks/queries/useInvalidateFinanceQueries'
import type { Pagador } from '../types/pagador.types'
import styles from './pages.module.css'

export function PagadoresPage() {
  const { showSuccess, handleError } = useApiFeedback()
  const { canWrite } = useAmbientePermissoes()
  const invalidate = useInvalidateFinanceQueries()
  const pagadoresQuery = usePagadoresQuery()
  const pagadores = pagadoresQuery.data ?? []
  const listLoading = pagadoresQuery.isPending

  const [descricao, setDescricao] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Pagador | null>(null)

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
      await invalidate.pagadores()
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
      await invalidate.pagadores()
    } catch (deleteError) {
      handleError(deleteError)
    }
  }

  const columns = useMemo<DataTableColumn<Pagador>[]>(
    () => [
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
    ],
    [canWrite],
  )

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
              <Button type="submit" loading={loading}>
                Cadastrar
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <p className={styles.editHint}>Seu papel neste ambiente é somente leitura.</p>
      )}

      <Card title="Pagadores cadastrados">
        <DataTable
          data={pagadores}
          columns={columns}
          loading={listLoading}
          getRowKey={(row) => row.id}
        />
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
