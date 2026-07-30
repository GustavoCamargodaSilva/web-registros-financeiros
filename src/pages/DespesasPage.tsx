import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ambientesApi } from '../api/ambientes.api'
import { cartoesApi } from '../api/cartoes.api'
import { categoriasApi } from '../api/categorias.api'
import { despesasApi } from '../api/despesas.api'
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
import { useAmbientePermissoes } from '../hooks/useAmbientePermissoes'
import { useApiFeedback } from '../hooks/useApiFeedback'
import type { Cartao } from '../types/cartao.types'
import type { Categoria } from '../types/categoria.types'
import type { Despesa, EscopoDespesa, TipoDespesa } from '../types/despesa.types'
import type { MembroAmbiente } from '../types/membro.types'
import { filtrarDespesas, type FiltroEscopoDespesa } from '../utils/despesasFiltro'
import { calcularResumoDespesas } from '../utils/despesasResumo'
import { formatCompetencia, formatCurrency, formatDate } from '../utils/format'
import { primeiroNome } from '../utils/nome'
import styles from './pages.module.css'

interface FormState {
  descricao: string
  valor: string
  vencimento: string
  tipoDespesa: TipoDespesa | ''
  quantidadeParcelas: string
  pago: string
  categoriaId: string
  cartaoId: string
  escopo: EscopoDespesa
  responsavelUsuarioId: string
}

function buildInitialForm(usuarioId?: number): FormState {
  return {
    descricao: '',
    valor: '',
    vencimento: '',
    tipoDespesa: '',
    quantidadeParcelas: '',
    pago: '',
    categoriaId: '',
    cartaoId: '',
    escopo: 'INDIVIDUAL',
    responsavelUsuarioId: usuarioId != null ? String(usuarioId) : '',
  }
}

function buildEditForm(despesa: Despesa): FormState {
  const totalParcelas = despesa.totalParcelas ?? 1
  const valorPrefill =
    despesa.tipoDespesa === 'VARIAVEL' && totalParcelas > 1
      ? (despesa.valor * totalParcelas).toFixed(2)
      : String(despesa.valor)

  return {
    descricao: despesa.descricao,
    valor: valorPrefill,
    vencimento: despesa.vencimento,
    tipoDespesa: despesa.tipoDespesa,
    quantidadeParcelas: totalParcelas > 1 ? String(totalParcelas) : '',
    pago: despesa.pago ? 'true' : 'false',
    categoriaId: String(despesa.categoriaId),
    cartaoId: despesa.cartaoId != null ? String(despesa.cartaoId) : '',
    escopo: despesa.escopo,
    responsavelUsuarioId:
      despesa.escopo === 'INDIVIDUAL' && despesa.responsavelUsuarioId != null
        ? String(despesa.responsavelUsuarioId)
        : '',
  }
}

function labelResponsavel(despesa: Despesa): string {
  if (despesa.escopo === 'CONJUNTA') {
    return 'Conjunta'
  }
  return primeiroNome(despesa.responsavelNome)
}

function labelTipoDespesa(tipo: TipoDespesa): string {
  if (tipo === 'UNICA') return 'Única'
  if (tipo === 'FIXO') return 'Fixo'
  return 'Variável'
}

export function DespesasPage() {
  const { ano, mes } = useCompetencia()
  const { usuario } = useAuth()
  const { canWrite } = useAmbientePermissoes()
  const { showSuccess, handleError } = useApiFeedback()
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [membros, setMembros] = useState<MembroAmbiente[]>([])
  const [form, setForm] = useState<FormState>(() => buildInitialForm(usuario?.id))
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [loading, setLoading] = useState(false)
  const [formAberto, setFormAberto] = useState(false)
  const [despesaEmEdicao, setDespesaEmEdicao] = useState<Despesa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Despesa | null>(null)
  const [pagoLoadingId, setPagoLoadingId] = useState<number | null>(null)
  const [filtroEscopo, setFiltroEscopo] = useState<FiltroEscopoDespesa>('TODOS')
  const [filtroResponsavelId, setFiltroResponsavelId] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [despesasResponse, categoriasResponse, cartoesResponse, membrosResponse] =
        await Promise.all([
          despesasApi.listarPorCompetencia(ano, mes),
          categoriasApi.listar(),
          cartoesApi.listar(),
          ambientesApi.listarMembrosAtivo(),
        ])
      setDespesas(despesasResponse)
      setCategorias(categoriasResponse)
      setCartoes(cartoesResponse)
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
    setDespesaEmEdicao(null)
    setForm(buildInitialForm(usuario?.id))
    setErrors({})
  }, [ano, mes, usuario?.id])

  useEffect(() => {
    if (!formAberto || despesaEmEdicao) {
      return
    }

    setForm((current) => {
      if (current.responsavelUsuarioId) {
        return current
      }
      const defaultId = usuario?.id ?? membros[0]?.usuarioId
      return {
        ...current,
        responsavelUsuarioId: defaultId != null ? String(defaultId) : '',
      }
    })
  }, [formAberto, despesaEmEdicao, usuario?.id, membros])

  const resumo = useMemo(() => calcularResumoDespesas(despesas), [despesas])

  const responsavelFiltroNumero =
    filtroResponsavelId === '' ? null : Number(filtroResponsavelId)

  const despesasFiltradas = useMemo(
    () => filtrarDespesas(despesas, filtroEscopo, responsavelFiltroNumero),
    [despesas, filtroEscopo, responsavelFiltroNumero],
  )

  const fecharFormulario = () => {
    setFormAberto(false)
    setDespesaEmEdicao(null)
    setErrors({})
    setForm(buildInitialForm(usuario?.id))
  }

  const abrirCadastro = () => {
    setDespesaEmEdicao(null)
    setErrors({})
    setForm(buildInitialForm(usuario?.id))
    setFormAberto(true)
  }

  const abrirEdicao = (despesa: Despesa) => {
    setFormAberto(false)
    setErrors({})
    setDespesaEmEdicao(despesa)
    setForm(buildEditForm(despesa))
  }

  const validate = (isEdit: boolean) => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {}

    if (!form.descricao.trim()) nextErrors.descricao = 'Descrição é obrigatória'
    if (!form.valor || Number(form.valor) <= 0) nextErrors.valor = 'Valor deve ser maior que zero'
    if (!form.vencimento) nextErrors.vencimento = 'Vencimento é obrigatório'
    if (!isEdit && !form.tipoDespesa) nextErrors.tipoDespesa = 'Tipo é obrigatório'
    if (!form.pago) nextErrors.pago = 'Status é obrigatório'
    if (!form.categoriaId) nextErrors.categoriaId = 'Categoria é obrigatória'
    if (!form.escopo) nextErrors.escopo = 'Escopo é obrigatório'
    if (form.escopo === 'INDIVIDUAL' && !form.responsavelUsuarioId) {
      nextErrors.responsavelUsuarioId = 'Responsável é obrigatório'
    }
    if (
      !isEdit &&
      form.tipoDespesa === 'VARIAVEL' &&
      (!form.quantidadeParcelas || Number(form.quantidadeParcelas) < 1)
    ) {
      nextErrors.quantidadeParcelas = 'Informe de 1 a 24 parcelas'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmitCadastro = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate(false)) {
      return
    }

    setLoading(true)

    try {
      await despesasApi.cadastrar({
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        vencimento: form.vencimento,
        tipoDespesa: form.tipoDespesa as TipoDespesa,
        pago: form.pago === 'true',
        categoriaId: Number(form.categoriaId),
        cartaoId: form.cartaoId ? Number(form.cartaoId) : null,
        quantidadeParcelas:
          form.tipoDespesa === 'VARIAVEL' ? Number(form.quantidadeParcelas) : undefined,
        escopo: form.escopo,
        responsavelUsuarioId:
          form.escopo === 'INDIVIDUAL' ? Number(form.responsavelUsuarioId) : null,
      })
      fecharFormulario()
      showSuccess('Despesa cadastrada com sucesso')
      await loadData()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEdicao = async (event: FormEvent) => {
    event.preventDefault()
    if (!despesaEmEdicao || !validate(true)) {
      return
    }

    setLoading(true)

    try {
      await despesasApi.atualizar(despesaEmEdicao.id, {
        descricao: form.descricao.trim(),
        valor: Number(form.valor),
        vencimento: form.vencimento,
        pago: form.pago === 'true',
        categoriaId: Number(form.categoriaId),
        cartaoId: form.cartaoId ? Number(form.cartaoId) : null,
        escopo: form.escopo,
        responsavelUsuarioId:
          form.escopo === 'INDIVIDUAL' ? Number(form.responsavelUsuarioId) : null,
      })
      fecharFormulario()
      showSuccess('Despesa atualizada com sucesso')
      await loadData()
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const responsavelDesabilitado = filtroEscopo === 'CONJUNTA'
  const formularioVisivel = canWrite && (formAberto || despesaEmEdicao != null)
  const editando = despesaEmEdicao != null
  const valorLabel =
    editando && despesaEmEdicao.tipoDespesa === 'VARIAVEL' ? 'Valor total' : 'Valor'

  const mensagemExclusao = (() => {
    if (!deleteTarget) {
      return ''
    }
    if (deleteTarget.tipoDespesa === 'UNICA') {
      return `Deseja excluir a despesa "${deleteTarget.descricao}"?`
    }
    if (deleteTarget.tipoDespesa === 'FIXO') {
      return `Deseja excluir a despesa "${deleteTarget.descricao}"? Serão removidas as ocorrências desta competência em diante. Meses anteriores permanecem intactos.`
    }
    return `Deseja excluir a despesa "${deleteTarget.descricao}"? Todas as parcelas desta série serão removidas.`
  })()

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    const excluindoSerieEditada =
      despesaEmEdicao != null &&
      (despesaEmEdicao.id === deleteTarget.id ||
        (deleteTarget.grupoParcelamento != null &&
          despesaEmEdicao.grupoParcelamento === deleteTarget.grupoParcelamento))

    try {
      await despesasApi.excluir(deleteTarget.id)
      const toastExclusao =
        deleteTarget.tipoDespesa === 'UNICA'
          ? 'Despesa excluída com sucesso'
          : deleteTarget.tipoDespesa === 'FIXO'
            ? 'Despesas a partir desta competência excluídas com sucesso'
            : 'Série de despesas excluída com sucesso'
      showSuccess(toastExclusao)
      setDeleteTarget(null)
      if (excluindoSerieEditada) {
        fecharFormulario()
      }
      await loadData()
    } catch (error) {
      handleError(error)
    }
  }

  const alternarPago = async (despesa: Despesa) => {
    const novoPago = !despesa.pago
    setPagoLoadingId(despesa.id)
    try {
      await despesasApi.atualizarPago(despesa.id, novoPago)
      showSuccess(novoPago ? 'Despesa marcada como paga' : 'Despesa marcada como pendente')
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
              <span className={styles.summaryLabel}>Competência</span>
              <span className={styles.summaryValue}>{formatCompetencia(ano, mes)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total geral</span>
              <span className={`${styles.summaryValue} ${styles.moneyExpense}`}>
                {formatCurrency(resumo.totalGeral)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Conjuntas</span>
              <span className={`${styles.summaryValue} ${styles.moneyExpense}`}>
                {formatCurrency(resumo.totalConjuntas)}
              </span>
            </div>
            {resumo.porResponsavel.map((item) => (
              <div key={item.usuarioId} className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{item.nome}</span>
                <span className={`${styles.summaryValue} ${styles.moneyExpense}`}>
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
          {canWrite && !formularioVisivel ? (
            <Button type="button" variant="primary" onClick={abrirCadastro}>
              Cadastrar
            </Button>
          ) : null}
          {!canWrite ? (
            <p className={styles.editHint}>Seu papel neste ambiente é somente leitura.</p>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className={styles.filtrosRow}>
          <Select
            label="Escopo"
            name="filtroEscopo"
            value={filtroEscopo}
            options={[
              { value: 'TODOS', label: 'Todas' },
              { value: 'INDIVIDUAL', label: 'Individuais' },
              { value: 'CONJUNTA', label: 'Conjuntas' },
            ]}
            onChange={(event) => {
              const value = event.target.value as FiltroEscopoDespesa
              setFiltroEscopo(value)
              if (value === 'CONJUNTA') {
                setFiltroResponsavelId('')
              }
            }}
          />
          <Select
            label="Responsável"
            name="filtroResponsavel"
            value={filtroResponsavelId}
            disabled={responsavelDesabilitado}
            options={[
              { value: '', label: 'Todos' },
              ...membros.map((membro) => ({
                value: membro.usuarioId,
                label: primeiroNome(membro.nome),
              })),
            ]}
            onChange={(event) => setFiltroResponsavelId(event.target.value)}
          />
        </div>
      </Card>

      {formularioVisivel ? (
        <Card>
          <div className={styles.formHeader}>
            <h2 className={styles.formHeaderTitle}>{editando ? 'Editar despesa' : 'Nova despesa'}</h2>
            <Button type="button" variant="outline" onClick={fecharFormulario}>
              Fechar
            </Button>
          </div>
          {editando && despesaEmEdicao.tipoDespesa === 'FIXO' ? (
            <p className={styles.editHint}>
              Valor, descrição, categoria, cartão e responsável serão aplicados a partir desta
              competência (meses anteriores permanecem intactos). O status pago e o vencimento valem
              só para esta ocorrência.
            </p>
          ) : null}
          {editando && despesaEmEdicao.tipoDespesa === 'VARIAVEL' ? (
            <p className={styles.editHint}>
              Valor, descrição, categoria, cartão e responsável serão aplicados a todas as parcelas
              desta série. O status pago vale só para esta competência.
            </p>
          ) : null}
          <form
            className={`${styles.form} ${styles.formGrid}`}
            onSubmit={editando ? handleSubmitEdicao : handleSubmitCadastro}
          >
            <Input
              label="Descrição"
              name="descricao"
              maxLength={30}
              value={form.descricao}
              error={errors.descricao}
              onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
            />
            <Input
              label={valorLabel}
              name="valor"
              type="number"
              step="0.01"
              min="0.01"
              value={form.valor}
              error={errors.valor}
              onChange={(event) => setForm((current) => ({ ...current, valor: event.target.value }))}
            />
            <Input
              label="Vencimento"
              name="vencimento"
              type="date"
              value={form.vencimento}
              error={errors.vencimento}
              onChange={(event) => setForm((current) => ({ ...current, vencimento: event.target.value }))}
            />
            {!editando ? (
              <Select
                label="Tipo"
                name="tipoDespesa"
                value={form.tipoDespesa}
                error={errors.tipoDespesa}
                placeholder="Selecione"
                options={[
                  { value: 'UNICA', label: 'Única (só este mês)' },
                  { value: 'FIXO', label: 'Fixo (repete 12 meses)' },
                  { value: 'VARIAVEL', label: 'Variável (parcelado)' },
                ]}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tipoDespesa: event.target.value as TipoDespesa | '',
                    quantidadeParcelas: '',
                  }))
                }
              />
            ) : (
              <Input
                label="Tipo"
                name="tipoDespesa"
                value={form.tipoDespesa ? labelTipoDespesa(form.tipoDespesa) : ''}
                disabled
                readOnly
              />
            )}
            {!editando && form.tipoDespesa === 'VARIAVEL' ? (
              <Input
                label="Quantidade de parcelas"
                name="quantidadeParcelas"
                type="number"
                min="1"
                max="24"
                value={form.quantidadeParcelas}
                error={errors.quantidadeParcelas}
                onChange={(event) =>
                  setForm((current) => ({ ...current, quantidadeParcelas: event.target.value }))
                }
              />
            ) : null}
            <Select
              label="Escopo"
              name="escopo"
              value={form.escopo}
              error={errors.escopo}
              options={[
                { value: 'INDIVIDUAL', label: 'Individual' },
                { value: 'CONJUNTA', label: 'Conjunta' },
              ]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  escopo: event.target.value as EscopoDespesa,
                  responsavelUsuarioId:
                    event.target.value === 'CONJUNTA'
                      ? ''
                      : current.responsavelUsuarioId || String(usuario?.id ?? ''),
                }))
              }
            />
            {form.escopo === 'INDIVIDUAL' ? (
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
            ) : null}
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
            <Select
              label="Categoria"
              name="categoriaId"
              value={form.categoriaId}
              error={errors.categoriaId}
              placeholder="Selecione"
              options={categorias.map((categoria) => ({
                value: categoria.id,
                label: categoria.descricao,
              }))}
              onChange={(event) => setForm((current) => ({ ...current, categoriaId: event.target.value }))}
            />
            <Select
              label="Cartão (opcional)"
              name="cartaoId"
              value={form.cartaoId}
              error={errors.cartaoId}
              placeholder="Sem cartão"
              options={cartoes.map((cartao) => ({
                value: cartao.id,
                label: cartao.nome,
              }))}
              onChange={(event) => setForm((current) => ({ ...current, cartaoId: event.target.value }))}
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

      <Card title="Despesas do mês">
        <DataTable
          data={despesasFiltradas}
          emptyMessage="Nenhuma despesa neste mês. Cadastre a primeira."
          columns={[
            {
              key: 'descricao',
              header: 'Descrição',
              width: '160px',
              truncate: true,
              priority: 'primary',
              title: (row) => row.descricao,
              render: (row) => row.descricao,
            },
            {
              key: 'valor',
              header: 'Valor',
              width: '110px',
              priority: 'primary',
              render: (row) => (
                <span className={styles.moneyExpense}>{formatCurrency(row.valor)}</span>
              ),
            },
            {
              key: 'vencimento',
              header: 'Vencimento',
              width: '110px',
              render: (row) => formatDate(row.vencimento),
            },
            {
              key: 'responsavel',
              header: 'Responsável',
              width: '18%',
              truncate: true,
              title: (row) =>
                row.escopo === 'CONJUNTA'
                  ? 'Conjunta'
                  : row.responsavelNome?.trim() || undefined,
              render: (row) => labelResponsavel(row),
            },
            {
              key: 'cartao',
              header: 'Cartão',
              width: '110px',
              truncate: true,
              title: (row) => row.cartaoNome,
              render: (row) => row.cartaoNome ?? '-',
            },
            {
              key: 'parcela',
              header: 'Parcela',
              width: '90px',
              priority: 'low',
              render: (row) =>
                row.totalParcelas && row.totalParcelas > 1
                  ? `${row.numeroParcela}/${row.totalParcelas}`
                  : '-',
            },
            {
              key: 'pago',
              header: 'Status',
              width: '14%',
              render: (row) => <Badge paid={row.pago} />,
            },
            ...(canWrite
              ? [
                  {
                    key: 'actions',
                    header: 'Ações',
                    width: '132px',
                    priority: 'actions' as const,
                    render: (row: Despesa) => (
                      <div className={styles.tableActions}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className={row.pago ? styles.actionPaid : undefined}
                          title={
                            row.pago ? 'Marcar este mês como pendente' : 'Marcar este mês como pago'
                          }
                          aria-label={
                            row.pago ? 'Marcar este mês como pendente' : 'Marcar este mês como pago'
                          }
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
                ]
              : []),
          ]}
        />
      </Card>

      <Modal
        open={Boolean(deleteTarget)}
        title="Excluir despesa"
        message={mensagemExclusao}
        confirmLabel="Excluir"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
