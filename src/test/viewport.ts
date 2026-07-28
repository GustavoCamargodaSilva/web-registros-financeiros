/**
 * O jsdom não implementa window.matchMedia, do qual os hooks de viewport e o
 * ThemeProvider dependem. Este mock resolve consultas `max-width`, `min-width`
 * e `prefers-color-scheme` contra um estado mutável, permitindo simular tanto a
 * troca de breakpoint quanto a preferência de tema do sistema.
 */

const DEFAULT_WIDTH = 1280

let viewportWidth = DEFAULT_WIDTH
let systemPrefersDark = false
const listeners = new Set<() => void>()

function queryMatches(query: string): boolean {
  if (query.includes('prefers-color-scheme: dark')) {
    return systemPrefersDark
  }
  if (query.includes('prefers-color-scheme: light')) {
    return !systemPrefersDark
  }
  const max = /\(max-width:\s*(\d+)px\)/.exec(query)
  if (max) {
    return viewportWidth <= Number(max[1])
  }
  const min = /\(min-width:\s*(\d+)px\)/.exec(query)
  if (min) {
    return viewportWidth >= Number(min[1])
  }
  return false
}

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

/** Altera a largura simulada e notifica os hooks inscritos. Chame dentro de act(). */
export function setViewportWidth(width: number) {
  viewportWidth = width
  notify()
}

/** Simula a preferência de tema do sistema. Chame dentro de act(). */
export function setPrefersDark(value: boolean) {
  systemPrefersDark = value
  notify()
}

export function resetViewport() {
  viewportWidth = DEFAULT_WIDTH
  systemPrefersDark = false
  listeners.clear()
}

export function installMatchMediaMock() {
  window.matchMedia = (query: string) =>
    ({
      get matches() {
        return queryMatches(query)
      },
      media: query,
      onchange: null,
      addEventListener: (_event: string, listener: () => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_event: string, listener: () => void) => {
        listeners.delete(listener)
      },
      addListener: (listener: () => void) => {
        listeners.add(listener)
      },
      removeListener: (listener: () => void) => {
        listeners.delete(listener)
      },
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
