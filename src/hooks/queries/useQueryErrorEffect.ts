import { useEffect } from 'react'

export function useQueryErrorEffect(error: unknown, handleError: (error: unknown) => unknown) {
  useEffect(() => {
    if (error) {
      handleError(error)
    }
  }, [error, handleError])
}
