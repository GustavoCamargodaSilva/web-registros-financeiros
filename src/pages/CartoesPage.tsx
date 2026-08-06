import { useMemo, useState, type FormEvent } from 'react'
import { cartoesApi } from '../api/cartoes.api'
import { IconTrash } from '../components/layout/NavIcons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable, type DataTableColumn } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useAmbientePermissoes } from '../hooks/useAmbientePermissoes'
import { useApiFeedback } from '../hooks/useApiFeedback'
import { useCartoesQuery } from '../hooks/queries/useFinanceQueries'
import { useInvalidateFinanceQueries } from '../hooks/queries/useInvalidateFinanceQueries'
import type { Cartao } from '../types/cartao.types'
import styles from './pages.module.css'

export function CartoesPage() {
  const { showSuccess, handleError } = useApiFeedback()
  const { canWrite } = useAmbientePermissoes()
  const invalidate = useInvalidateFinanceQueries()
  const cartoesQuery = useCartoesQuery()
  const cartoes = cartoesQuery.data ?? []
  const listLoading = cartoesQuery.isPending

  const [nome, setNome] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Cartao | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canWrite) {
      return
    }
    const trimmed = nome.trim().toUpperCase()

    if (!trimmed) {
      setError('Nome é obrigatório')
      return
    }

    if (trimmed.length > 30) {
      setError('Nome não pode ter mais de 30 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      await cartoesApi.cadastrar({ nome: trimmed })
      setNome('')
      showSuccess('Cartão cadastrado com sucesso')
      await invalidate.cartoes()
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
      await cartoesApi.excluir(deleteTarget.id)
      showSuccess('Cartão excluído com sucesso')
      setDeleteTarget(null)
      await invalidate.cartoes()
    } catch (deleteError) {
      handleError(deleteError)
    }
  }

  const columns = useMemo<DataTableColumn<Cartao>[]>(
    () => [
      { key: 'id', header: 'ID', hideOnMobile: true, render: (row: Cartao) => row.id },
      {
        key: 'nome',
        header: 'Nome',
        priority: 'primary',
        render: (row: Cartao) => row.nome,
      },
      ...(canWrite
        ? [
            {
              key: 'actions',
              header: 'Ações',
              priority: 'actions' as const,
              render: (row: Cartao) => (
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
        <Card title="Novo cartão">
          <form className={`${styles.form} ${styles.formNarrow}`} onSubmit={handleSubmit}>
            <Input
              label="Nome"
              name="nome"
              value={nome}
              maxLength={30}
              error={error}
              onChange={(event) => setNome(event.target.value)}
              onBlur={() => setNome((current) => current.trim().toUpperCase())}
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

      <Card title="Cartões cadastrados">
        <DataTable
          data={cartoes}
          columns={columns}
          loading={listLoading}
          getRowKey={(row) => row.id}
        />
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        title="Excluir cartão"
        message={`Deseja excluir "${deleteTarget?.nome}"?`}
        confirmLabel="Excluir"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
