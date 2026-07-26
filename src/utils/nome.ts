/** Retorna apenas o primeiro nome para exibição em listas/tabelas. */
export function primeiroNome(nome?: string | null): string {
  const trimmed = nome?.trim()
  if (!trimmed) {
    return '—'
  }
  return trimmed.split(/\s+/)[0] ?? '—'
}
