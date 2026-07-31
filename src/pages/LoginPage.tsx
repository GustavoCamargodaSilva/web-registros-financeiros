import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { consumeAuthMessage } from '../api/authMessage'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PasswordInput } from '../components/ui/PasswordInput'
import { useAuth } from '../context/AuthContext'
import { useApiFeedback } from '../hooks/useApiFeedback'
import { buildAuthPath, getSafeReturnUrl } from '../utils/returnUrl'
import { AuthPage } from './AuthPage'
import styles from './auth.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const { login, isAuthenticated } = useAuth()
  const { showError, handleError } = useApiFeedback()
  const [loginField, setLoginField] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState<{ login?: string; senha?: string }>({})
  const [loading, setLoading] = useState(false)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  useEffect(() => {
    const message = consumeAuthMessage()
    if (message) {
      setInfoMessage(message)
      showError(message)
    }
  }, [showError])

  if (isAuthenticated) {
    return <Navigate to={returnUrl} replace />
  }

  const validate = () => {
    const nextErrors: { login?: string; senha?: string } = {}
    if (!loginField.trim()) nextErrors.login = 'E-mail ou telefone é obrigatório'
    if (!senha) nextErrors.senha = 'Senha é obrigatória'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return

    setLoading(true)
    setInfoMessage(null)
    try {
      await login({ login: loginField.trim(), senha })
      navigate(returnUrl)
    } catch (error) {
      handleError(error, 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPage>
      <Card title="Entrar">
        {infoMessage ? <p className={styles.message}>{infoMessage}</p> : null}
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="E-mail ou telefone"
            name="login"
            value={loginField}
            error={errors.login}
            autoComplete="username"
            onChange={(event) => setLoginField(event.target.value)}
          />
          <PasswordInput
            label="Senha"
            name="senha"
            value={senha}
            error={errors.senha}
            autoComplete="current-password"
            onChange={(event) => setSenha(event.target.value)}
          />
          <Button type="submit" loading={loading}>
            Entrar
          </Button>
        </form>
        <p className={styles.footer}>
          Não tem conta?{' '}
          <Link className={styles.link} to={buildAuthPath('/registro', returnUrl)}>
            Cadastre-se
          </Link>
        </p>
      </Card>
    </AuthPage>
  )
}
