import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '../api/client'
import { ambienteStorage } from '../api/ambienteStorage'
import { convitesApi } from '../api/convites.api'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import type { AceitarConviteResponse } from '../types/convite.types'
import { buildAuthPath } from '../utils/returnUrl'
import styles from './auth.module.css'

type PageStatus = 'idle' | 'accepting' | 'success' | 'error'

const acceptGuard = {
  inFlight: null as string | null,
  done: null as string | null,
}

export function AceitarConvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const { isAuthenticated, isLoading, logout } = useAuth()

  const [status, setStatus] = useState<PageStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<AceitarConviteResponse | null>(null)

  const returnUrl = token
    ? `/convites/aceitar?token=${encodeURIComponent(token)}`
    : '/convites/aceitar'

  const aceitar = useCallback(async () => {
    if (!token) return
    if (acceptGuard.done === token || acceptGuard.inFlight === token) return

    acceptGuard.inFlight = token
    setStatus('accepting')
    setErrorMessage(null)

    try {
      const response = await convitesApi.aceitar(token)
      ambienteStorage.set(response.ambienteId)
      acceptGuard.done = token
      setResult(response)
      setStatus('success')
    } catch (error) {
      const message =
        error instanceof ApiError
          ? (error.body.mensagem ?? error.message)
          : 'Não foi possível aceitar o convite.'
      const isExpiredOrInvalid =
        /expir|inválid|invalido|cancelad|não encontrado|nao encontrado/i.test(message)
      setErrorMessage(
        isExpiredOrInvalid
          ? `${message} Solicite um novo convite ao dono do ambiente.`
          : message,
      )
      setStatus('error')
    } finally {
      if (acceptGuard.inFlight === token) {
        acceptGuard.inFlight = null
      }
    }
  }, [token])

  useEffect(() => {
    if (!token || !isAuthenticated || isLoading) return
    void aceitar()
  }, [token, isAuthenticated, isLoading, aceitar])

  if (!token) {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <Card title="Convite inválido">
            <p className={styles.message}>
              O link de convite está incompleto ou inválido. Peça um novo convite ao responsável.
            </p>
            <div className={styles.actions}>
              <Button type="button" onClick={() => navigate('/login')}>
                Ir para o login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (isLoading || (isAuthenticated && (status === 'idle' || status === 'accepting'))) {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <Card title="Aceitar convite">
            <p className={styles.message}>Aceitando convite…</p>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <Card title="Convite para editar despesas">
            <p className={styles.message}>
              Para aceitar o convite, entre com a conta do e-mail convidado ou crie uma conta com esse
              mesmo e-mail.
            </p>
            <div className={styles.actions}>
              <Button type="button" onClick={() => navigate(buildAuthPath('/login', returnUrl))}>
                Já tenho conta
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(buildAuthPath('/registro', returnUrl))}
              >
                Criar conta
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (status === 'success' && result) {
    return (
      <div className={styles.authPage}>
        <div className={styles.card}>
          <Card title="Convite aceito">
            <p className={styles.message}>
              Você entrou no ambiente <strong>{result.ambienteNome}</strong> como{' '}
              <strong>{result.papel}</strong>.
            </p>
            <div className={styles.actions}>
              <Button type="button" onClick={() => navigate('/despesas')}>
                Ir para despesas
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.card}>
        <Card title="Não foi possível aceitar">
          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
          <div className={styles.actions}>
            <Button
              type="button"
              onClick={() => {
                acceptGuard.done = null
                void aceitar()
              }}
            >
              Tentar novamente
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                acceptGuard.done = null
                await logout()
                navigate(buildAuthPath('/login', returnUrl))
              }}
            >
              Sair e entrar com outro e-mail
            </Button>
          </div>
          <p className={styles.footer}>
            <Link className={styles.link} to="/despesas">
              Voltar ao app
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
