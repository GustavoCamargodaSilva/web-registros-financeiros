import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { useApiFeedback } from '../hooks/useApiFeedback'
import { SENHA_MAX_LENGTH, SENHA_MIN_LENGTH, validarSenha } from '../utils/senha'
import { buildAuthPath, getSafeReturnUrl } from '../utils/returnUrl'
import styles from './auth.module.css'

export function RegistroPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const { registro, isAuthenticated } = useAuth()
  const { showSuccess, handleError } = useApiFeedback()
  const [form, setForm] = useState({
    nome: '',
    sobrenome: '',
    telefone: '',
    email: '',
    senha: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={returnUrl} replace />
  }

  const validate = () => {
    const nextErrors: Partial<typeof form> = {}
    if (form.nome.trim().length < 2) nextErrors.nome = 'Nome deve ter no mínimo 2 caracteres'
    if (form.sobrenome.trim().length < 2) {
      nextErrors.sobrenome = 'Sobrenome deve ter no mínimo 2 caracteres'
    }
    if (!/^\d{10,11}$/.test(form.telefone)) nextErrors.telefone = 'Telefone deve ter 10 ou 11 dígitos'
    if (!form.email.trim()) nextErrors.email = 'E-mail é obrigatório'
    const senhaErro = validarSenha(form.senha)
    if (senhaErro) nextErrors.senha = senhaErro
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await registro({
        nome: form.nome.trim(),
        sobrenome: form.sobrenome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
      })
      showSuccess(
        'Se os dados estiverem disponíveis, a conta foi criada. Entre com seu e-mail e senha.',
      )
      navigate(buildAuthPath('/login', returnUrl))
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <Card title="Criar conta">
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              label="Nome"
              name="nome"
              value={form.nome}
              error={errors.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
            />
            <Input
              label="Sobrenome"
              name="sobrenome"
              value={form.sobrenome}
              error={errors.sobrenome}
              onChange={(event) =>
                setForm((current) => ({ ...current, sobrenome: event.target.value }))
              }
            />
            <Input
              label="Telefone"
              name="telefone"
              placeholder="11999998888"
              value={form.telefone}
              error={errors.telefone}
              onChange={(event) => setForm((current) => ({ ...current, telefone: event.target.value }))}
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <Input
              label="Senha"
              name="senha"
              type="password"
              value={form.senha}
              error={errors.senha}
              hint={`Entre ${SENHA_MIN_LENGTH} e ${SENHA_MAX_LENGTH} caracteres`}
              minLength={SENHA_MIN_LENGTH}
              maxLength={SENHA_MAX_LENGTH}
              autoComplete="new-password"
              onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
            />
            <Button type="submit" disabled={loading}>
              Cadastrar
            </Button>
          </form>
          <p className={styles.footer}>
            Já tem conta?{' '}
            <Link className={styles.link} to={buildAuthPath('/login', returnUrl)}>
              Entrar
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
