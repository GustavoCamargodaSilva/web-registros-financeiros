const AMBIENTE_ID_KEY = 'ambienteId'

export const ambienteStorage = {
  get(): number | null {
    const raw = sessionStorage.getItem(AMBIENTE_ID_KEY)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  },
  set(ambienteId: number) {
    sessionStorage.setItem(AMBIENTE_ID_KEY, String(ambienteId))
  },
  clear() {
    sessionStorage.removeItem(AMBIENTE_ID_KEY)
  },
}
