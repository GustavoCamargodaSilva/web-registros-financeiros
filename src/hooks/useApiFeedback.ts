import { useCallback } from 'react'
import { ApiError } from '../api/client'
import { useToast } from '../components/toast/ToastProvider'

export function useApiFeedback() {
  const { showSuccess, showError } = useToast()

  const handleError = useCallback(
    (error: unknown, fallback = 'Não foi possível concluir a operação.') => {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          const fieldMessages = Object.entries(error.body)
            .filter(([key]) => key !== 'mensagem')
            .map(([, message]) => message)
          showError(fieldMessages[0] ?? error.message)
          return error.body
        }
        showError(error.body.mensagem ?? error.message)
        return error.body
      }

      showError(fallback)
      return {}
    },
    [showError],
  )

  return { showSuccess, showError, handleError }
}
