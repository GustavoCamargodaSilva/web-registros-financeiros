import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { categoriasApi } from '../api/categorias.api'
import { IconTrash } from '../components/layout/NavIcons'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { useApiFeedback } from '../hooks/useApiFeedback'
import type { Categoria } from '../types/categoria.types'
import styles from './pages.module.css'

export function CategoriasPage() {
  const { showSuccess, handleError } = useApiFeedback()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [descricao, setDescricao] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)

  const loadCategorias = useCallback(async () => {
    try {
      setCategorias(await categoriasApi.listar())
    } catch (loadError) {
      handleError(loadError)
    }
  }, [handleError])

  useEffect(() => {
    void loadCategorias()
  }, [loadCategorias])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
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
      await loadCategorias()
    } catch (submitError) {
      handleError(submitError)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      await categoriasApi.excluir(deleteTarget.id)
      showSuccess('Categoria excluída com sucesso')
      setDeleteTarget(null)
      await loadCategorias()
    } catch (deleteError) {
      handleError(deleteError)
    }
  }

  return (
    <div className={styles.stack}>
      <Card title="Nova categoria">
        <form className={styles.form} onSubmit={handleSubmit}>
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

      <Card title="Categorias cadastradas">
        <DataTable
          data={categorias}
          columns={[
            { key: 'id', header: 'ID', render: (row) => row.id },
            { key: 'descricao', header: 'Descrição', render: (row) => row.descricao },
            {
              key: 'actions',
              header: 'Ações',
              render: (row) => (
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
          ]}
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
