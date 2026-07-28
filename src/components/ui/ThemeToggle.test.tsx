import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { THEME_ATTRIBUTE } from '../../constants/theme'
import { ThemeProvider } from '../../context/ThemeContext'
import { ThemeToggle } from './ThemeToggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  })

  it('anuncia a ação de destino, não o estado atual', () => {
    renderToggle()

    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument()
  })

  it('troca o rótulo e aplica o tema ao clicar', () => {
    renderToggle()

    fireEvent.click(screen.getByRole('button', { name: 'Ativar tema escuro' }))

    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, 'dark')
  })
})
