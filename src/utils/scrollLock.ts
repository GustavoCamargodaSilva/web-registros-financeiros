/**
 * Bloqueio de rolagem do body compartilhado entre drawer e modal.
 *
 * Usa contagem de referências porque os dois podem estar abertos ao mesmo
 * tempo: sem isso, fechar um deles liberaria a rolagem com o outro ainda aberto.
 */

let lockCount = 0
let previousOverflow = ''
let previousPaddingRight = ''

export function lockBodyScroll() {
  if (typeof document === 'undefined') {
    return
  }

  lockCount += 1
  if (lockCount > 1) {
    return
  }

  const { body } = document
  previousOverflow = body.style.overflow
  previousPaddingRight = body.style.paddingRight

  // Compensa a barra de rolagem para o conteúdo não deslocar no desktop
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`
  }

  body.style.overflow = 'hidden'
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined' || lockCount === 0) {
    return
  }

  lockCount -= 1
  if (lockCount > 0) {
    return
  }

  const { body } = document
  body.style.overflow = previousOverflow
  body.style.paddingRight = previousPaddingRight
}
