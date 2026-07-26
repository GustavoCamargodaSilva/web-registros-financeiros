import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { ANO_BASE } from '../constants/competencia'

interface CompetenciaContextValue {
  ano: number
  mes: number
  setAno: (ano: number) => void
  setMes: (mes: number) => void
}

const CompetenciaContext = createContext<CompetenciaContextValue | null>(null)

export function CompetenciaProvider({ children }: { children: ReactNode }) {
  const now = new Date()
  const [ano, setAnoState] = useState(Math.max(ANO_BASE, now.getFullYear()))
  const [mes, setMes] = useState(now.getMonth() + 1)

  const setAno = useCallback((proximo: number) => {
    setAnoState(Math.max(ANO_BASE, proximo))
  }, [])

  const value = useMemo(
    () => ({ ano, mes, setAno, setMes }),
    [ano, mes, setAno],
  )

  return (
    <CompetenciaContext.Provider value={value}>{children}</CompetenciaContext.Provider>
  )
}

export function useCompetencia() {
  const context = useContext(CompetenciaContext)
  if (!context) {
    throw new Error('useCompetencia deve ser usado dentro de CompetenciaProvider')
  }
  return context
}
