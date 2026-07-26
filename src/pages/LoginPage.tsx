import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'
import { useApiFeedback } from '../hooks/useApiFeedback'
import { buildAuthPath, getSafeReturnUrl } from '../utils/returnUrl'
import styles from './auth.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'))
  const { login, isAuthenticated } = useAuth()
  const { handleError } = useApiFeedback()
  const [loginField, setLoginField] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState<{ login?: string; senha?: string }>({})
  const [loading, setLoading] = useState(false)

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
    try {
      await login({ login: loginField.trim(), senha })
      navigate(returnUrl)
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <Card title="Entrar">
          <form className={styles.form} onSubmit={handleSubmit}>
            <Input
              label="E-mail ou telefone"
              name="login"
              value={loginField}
              error={errors.login}
              onChange={(event) => setLoginField(event.target.value)}
            />
            <Input
              label="Senha"
              name="senha"
              type="password"
              value={senha}
              error={errors.senha}
              onChange={(event) => setSenha(event.target.value)}
            />
            <Button type="submit" disabled={loading}>
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
      </div>
    </div>
  )
}
