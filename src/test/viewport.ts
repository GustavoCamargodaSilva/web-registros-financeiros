/**
 * O jsdom não implementa window.matchMedia, do qual os hooks de viewport
 * dependem. Este mock resolve consultas `max-width` e `min-width` contra uma
 * largura mutável, permitindo simular a troca de breakpoint nos testes.
 */

const DEFAULT_WIDTH = 1280

let viewportWidth = DEFAULT_WIDTH
const listeners = new Set<() => void>()

function queryMatches(query: string): boolean {
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

/** Altera a largura simulada e notifica os hooks inscritos. Chame dentro de act(). */
export function setViewportWidth(width: number) {
  viewportWidth = width
  for (const listener of listeners) {
    listener()
  }
}

export function resetViewport() {
  viewportWidth = DEFAULT_WIDTH
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
