import { useCallback, useSyncExternalStore } from 'react'

function isSupported() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
}

/**
 * Avalia uma media query e re-renderiza quando o resultado muda.
 *
 * Usa useSyncExternalStore para que a primeira renderização já leia o valor
 * correto, evitando o flash de layout que um useState + useEffect causaria.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!isSupported()) {
        return () => {}
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', onStoreChange)
      return () => list.removeEventListener('change', onStoreChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    if (!isSupported()) {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
