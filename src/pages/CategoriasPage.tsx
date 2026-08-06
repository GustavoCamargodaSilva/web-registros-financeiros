import { useMemo, useState, type FormEvent } from 'react'
import { categoriasApi } from '../api/categorias.api'
import { IconTrash } from '../components/layout/NavIcons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAmbientePermissoes } from '../hooks/useAmbientePermissoes'
import { useApiFeedback } from '../hooks/useApiFeedback'
import { useCategoriasQuery } from '../hooks/queries/useFinanceQueries'
import { useInvalidateFinanceQueries } from '../hooks/queries/useInvalidateFinanceQueries'
import type { Categoria } from '../types/categoria.types'
import styles from './pages.module.css'

export function CategoriasPage() {
  const { showSuccess, handleError } = useApiFeedback()
  const { canWrite } = useAmbientePermissoes()
  const invalidate = useInvalidateFinanceQueries()
  const categoriasQuery = useCategoriasQuery()
  const categorias = categoriasQuery.data ?? []
  const listLoading = categoriasQuery.isPending

  const [descricao, setDescricao] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)

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
      await categoriasApi.cadastrar({ descricao: trimmed })
      setDescricao('')
      showSuccess('Categoria cadastrada com sucesso')
      await invalidate.categorias()
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
      await categoriasApi.excluir(deleteTarget.id)
      showSuccess('Categoria excluída com sucesso')
      setDeleteTarget(null)
      await invalidate.categorias()
    } catch (deleteError) {
      handleError(deleteError)
    }
  }

  const columns = useMemo<DataTableColumn<Categoria>[]>(
    () => [
      { key: 'id', header: 'ID', hideOnMobile: true, render: (row: Categoria) => row.id },
      {
        key: 'descricao',
        header: 'Descrição',
        priority: 'primary',
        render: (row: Categoria) => row.descricao,
      },
      ...(canWrite
        ? [
            {
              key: 'actions',
              header: 'Ações',
              priority: 'actions' as const,
              render: (row: Categoria) => (
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
        <Card title="Nova categoria">
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

      <Card title="Categorias cadastradas">
        <DataTable
          data={categorias}
          columns={columns}
          loading={listLoading}
          getRowKey={(row) => row.id}
        />
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        title="Excluir categoria"
        message={`Deseja excluir "${deleteTarget?.descricao}"?`}
        confirmLabel="Excluir"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
