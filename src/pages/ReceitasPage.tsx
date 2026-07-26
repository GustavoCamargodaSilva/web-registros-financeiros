import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ambientesApi } from '../api/ambientes.api'
import { pagadoresApi } from '../api/pagadores.api'
import { receitasApi } from '../api/receitas.api'
import { IconCheck, IconEdit, IconTrash } from '../components/layout/NavIcons'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DataTable } from '../components/ui/DataTable'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { useAuth } from '../context/AuthContext'
import { useCompetencia } from '../context/CompetenciaContext'
import { useApiFeedback } from '../hooks/useApiFeedback'
import type { MembroAmbiente } from '../types/membro.types'
import type { Pagador } from '../types/pagador.types'
import type { Receita } from '../types/receita.types'
import { formatCompetencia, formatCurrency, formatDate, formatPercent } from '../utils/format'
import { primeiroNome } from '../utils/nome'
import { calcularResumoReceitas } from '../utils/receitasResumo'
import styles from './pages.module.css'

interface FormState {
  pagadorId: string
  valor: string
  pago: string
  dataPagamento: string
  responsavelUsuarioId: string
}

function buildInitialForm(usuarioId?: number): FormState {
  return {
    pagadorId: '',
    valor: '',
    pago: '',
    dataPagamento: '',
    responsavelUsuarioId: usuarioId != null ? String(usuarioId) : '',
  }
}

function buildEditForm(receita: Receita): FormState {
  return {
    pagadorId: String(receita.pagadorId),
    valor: String(receita.valor),
    pago: String(receita.pago),
    dataPagamento: receita.dataPagamento,
    responsavelUsuarioId:
      receita.responsavelUsuarioId != null ? String(receita.responsavelUsuarioId) : '',
  }
}

export function ReceitasPage() {
  const { ano, mes } = useCompetencia()
  const { usuario } = useAuth()
  const { showSuccess, handleError } = useApiFeedback()
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [pagadores, setPagadores] = useState<Pagador[]>([])
  const [membros, setMembros] = useState<MembroAmbiente[]>([])
  const [form, setForm] = useState<FormState>(() => buildInitialForm(usuario?.id))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(false)
  const [formAberto, setFormAberto] = useState(false)
  const [receitaEmEdicao, setReceitaEmEdicao] = useState<Receita | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Receita | null>(null)
  const [pagoLoadingId, setPagoLoadingId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [receitasResponse, pagadoresResponse, membrosResponse] = await Promise.all([
        receitasApi.listarPorCompetencia(ano, mes),
        pagadoresApi.listar(),
        ambientesApi.listarMembrosAtivo(),
      ])
      setReceitas(receitasResponse.receitas)
      setPagadores(pagadoresResponse)
      setMembros(membrosResponse)
    } catch (error) {
      handleError(error)
    }
  }, [ano, mes, handleError])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    setFormAberto(false)
    setReceitaEmEdicao(null)
    setForm(buildInitialForm(usuario?.id))
    setErrors({})
  }, [ano, mes, usuario?.id])

  useEffect(() => {
    if (!formAberto || receitaEmEdicao) {
      return
    }
    setForm((current) => {
      if (current.responsavelUsuarioId) {
        return current
      }
      return {
        ...current,
        responsavelUsuarioId: usuario?.id != null ? String(usuario.id) : '',
      }
    })
  }, [formAberto, receitaEmEdicao, usuario?.id])

  const resumo = useMemo(() => calcularResumoReceitas(receitas), [receitas])
  const formularioVisivel = formAberto || receitaEmEdicao != null
  const editando = receitaEmEdicao != null

  const fecharFormulario = () => {
    setFormAberto(false)
    setReceitaEmEdicao(null)
    setForm(buildInitialForm(usuario?.id))
    setErrors({})
  }

  const abrirCadastro = () => {
    setReceitaEmEdicao(null)
    setForm(buildInitialForm(usuario?.id))
    setErrors({})
    setFormAberto(true)
  }

  const abrirEdicao = (receita: Receita) => {
    setFormAberto(false)
    setErrors({})
    setReceitaEmEdicao(receita)
    setForm(buildEditForm(receita))
  }

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (!form.pagadorId) nextErrors.pagadorId = 'Pagador é obrigatório'
    if (!form.valor || Number(form.valor) <= 0) nextErrors.valor = 'Valor deve ser maior que zero'
    if (!form.pago) nextErrors.pago = 'Status é obrigatório'
    if (!form.dataPagamento) nextErrors.dataPagamento = 'Data de pagamento é obrigatória'
    if (!form.responsavelUsuarioId) nextErrors.responsavelUsuarioId = 'Responsável é obrigatório'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const payload = () => ({
    pagadorId: Number(form.pagadorId),
    valor: Number(form.valor),
    pago: form.pago === 'true',
    dataPagamento: form.dataPagamento,
    responsavelUsuarioId: Number(form.responsavelUsuarioId),
  })

  const handleSubmitCadastro = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      await receitasApi.cadastrar(payload())
      fecharFormulario()
      showSuccess('Receita cadastrada com sucesso')
      await loadData()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEdicao = async (event: FormEvent) => {
    event.preventDefault()
    if (!receitaEmEdicao || !validate()) {
      return
    }

    setLoading(true)

    try {
      await receitasApi.atualizar(receitaEmEdicao.id, payload())
      fecharFormulario()
      showSuccess('Receita atualizada com sucesso')
      await loadData()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    try {
      await receitasApi.excluir(deleteTarget.id)
      showSuccess('Receita excluída com sucesso')
      setDeleteTarget(null)
      await loadData()
    } catch (error) {
      handleError(error)
    }
  }

  const alternarPago = async (receita: Receita) => {
    const novoPago = !receita.pago
    setPagoLoadingId(receita.id)
    try {
      await receitasApi.atualizarPago(receita.id, novoPago)
      showSuccess(novoPago ? 'Receita marcada como paga' : 'Receita marcada como pendente')
      await loadData()
    } catch (error) {
      handleError(error)
    } finally {
      setPagoLoadingId(null)
    }
  }

  return (
    <div className={styles.stack}>
      <Card>
        <div className={styles.toolbar}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>
                Total geral — {formatCompetencia(ano, mes)}
              </span>
              <span className={`${styles.summaryValue} ${styles.moneyIncome}`}>
                {formatCurrency(resumo.totalGeral)}
              </span>
            </div>
            {resumo.porResponsavel.map((item) => (
              <div key={item.usuarioId} className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{item.nome}</span>
                <span className={`${styles.summaryValue} ${styles.moneyIncome}`}>
                  {formatCurrency(item.total)} ({formatPercent(item.percentual)})
                </span>
              </div>
            ))}
          </div>
          {!formularioVisivel ? (
            <Button type="button" variant="primary" onClick={abrirCadastro}>
              Cadastrar
            </Button>
          ) : null}
        </div>
      </Card>

      {formularioVisivel ? (
        <Card>
          <div className={styles.formHeader}>
            <h2 className={styles.formHeaderTitle}>
              {editando ? 'Editar receita' : 'Nova receita'}
            </h2>
            <Button type="button" variant="outline" onClick={fecharFormulario}>
              Fechar
            </Button>
          </div>
          <form
            className={`${styles.form} ${styles.formGrid}`}
            onSubmit={editando ? handleSubmitEdicao : handleSubmitCadastro}
          >
            <Select
              label="Pagador"
              name="pagadorId"
              value={form.pagadorId}
              error={errors.pagadorId}
              placeholder="Selecione"
              options={pagadores.map((pagador) => ({
                value: pagador.id,
                label: pagador.descricao,
              }))}
              onChange={(event) =>
                setForm((current) => ({ ...current, pagadorId: event.target.value }))
              }
            />
            <Select
              label="Responsável"
              name="responsavelUsuarioId"
              value={form.responsavelUsuarioId}
              error={errors.responsavelUsuarioId}
              placeholder="Selecione"
              options={membros.map((membro) => ({
                value: membro.usuarioId,
                label: primeiroNome(membro.nome),
              }))}
              onChange={(event) =>
                setForm((current) => ({ ...current, responsavelUsuarioId: event.target.value }))
              }
            />
            <Input
              label="Valor"
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              value={form.valor}
              error={errors.valor}
              onChange={(event) => setForm((current) => ({ ...current, valor: event.target.value }))}
            />
            <Select
              label="Pago"
              name="pago"
              value={form.pago}
              error={errors.pago}
              placeholder="Selecione"
              options={[
                { value: 'true', label: 'Sim' },
                { value: 'false', label: 'Não' },
              ]}
              onChange={(event) => setForm((current) => ({ ...current, pago: event.target.value }))}
            />
            <Input
              label="Data de pagamento"
              name="dataPagamento"
              type="date"
              value={form.dataPagamento}
              error={errors.dataPagamento}
              onChange={(event) =>
                setForm((current) => ({ ...current, dataPagamento: event.target.value }))
              }
            />
            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={fecharFormulario} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {editando ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card title="Receitas do mês">
        <DataTable
          data={receitas}
          emptyMessage="Nenhuma receita neste mês. Cadastre a primeira."
          columns={[
            {
              key: 'pagador',
              header: 'Pagador',
              width: '18%',
              truncate: true,
              title: (row) => row.pagadorDescricao,
              render: (row) => row.pagadorDescricao,
            },
            {
              key: 'responsavel',
              header: 'Responsável',
              width: '16%',
              truncate: true,
              title: (row) => row.responsavelNome?.trim() || undefined,
              render: (row) => primeiroNome(row.responsavelNome),
            },
            {
              key: 'valor',
              header: 'Valor',
              width: '14%',
              render: (row) => (
                <span className={styles.moneyIncome}>{formatCurrency(row.valor)}</span>
              ),
            },
            {
              key: 'dataPagamento',
              header: 'Pagamento',
              width: '16%',
              render: (row) => formatDate(row.dataPagamento),
            },
            {
              key: 'pago',
              header: 'Status',
              width: '16%',
              render: (row) => <Badge paid={row.pago} />,
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '132px',
              render: (row) => (
                <div className={styles.tableActions}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={row.pago ? styles.actionPaid : undefined}
                    title={row.pago ? 'Marcar como pendente' : 'Marcar como paga'}
                    aria-label={row.pago ? 'Marcar como pendente' : 'Marcar como paga'}
                    disabled={pagoLoadingId === row.id}
                    onClick={() => void alternarPago(row)}
                  >
                    <IconCheck />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Editar"
                    aria-label="Editar"
                    onClick={() => abrirEdicao(row)}
                  >
                    <IconEdit />
                  </Button>
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
        title="Excluir receita"
        message={`Deseja excluir a receita de ${deleteTarget?.pagadorDescricao}?`}
        confirmLabel="Excluir"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
