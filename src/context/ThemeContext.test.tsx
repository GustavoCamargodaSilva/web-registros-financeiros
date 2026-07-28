import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from '../constants/theme'
import { setPrefersDark } from '../test/viewport'
import { ThemeProvider, useTheme } from './ThemeContext'

function ThemeProbe() {
  const { mode, resolvedTheme, toggleTheme, setMode } = useTheme()
  return (
    <>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={toggleTheme}>
        alternar
      </button>
      <button type="button" onClick={() => setMode('system')}>
        seguir sistema
      </button>
    </>
  )
}

function renderProbe() {
  return render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  )
}

const mode = () => screen.getByTestId('mode')
const resolved = () => screen.getByTestId('resolved')

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute(THEME_ATTRIBUTE)
  })

  it('começa em system e resolve para claro quando o sistema não pede escuro', () => {
    renderProbe()

    expect(mode()).toHaveTextContent('system')
    expect(resolved()).toHaveTextContent('light')
    expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, 'light')
  })

  it('resolve para escuro quando o sistema prefere escuro', () => {
    setPrefersDark(true)
    renderProbe()

    expect(resolved()).toHaveTextContent('dark')
    expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, 'dark')
  })

  it('acompanha a mudança de preferência do sistema', () => {
    renderProbe()
    expect(resolved()).toHaveTextContent('light')

    act(() => setPrefersDark(true))

    expect(resolved()).toHaveTextContent('dark')
    expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, 'dark')
  })

  it('restaura a preferência salva no localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderProbe()

    expect(mode()).toHaveTextContent('dark')
    expect(resolved()).toHaveTextContent('dark')
  })

  it('cai no padrão quando o valor salvo é inválido', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'roxo')
    renderProbe()

    expect(mode()).toHaveTextContent('system')
  })

  it('alterna e persiste a escolha', () => {
    renderProbe()

    fireEvent.click(screen.getByRole('button', { name: 'alternar' }))

    expect(mode()).toHaveTextContent('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveAttribute(THEME_ATTRIBUTE, 'dark')
  })

  it('deixa de seguir o sistema depois de uma escolha explícita', () => {
    setPrefersDark(true)
    renderProbe()

    // Sistema escuro, usuário força claro
    fireEvent.click(screen.getByRole('button', { name: 'alternar' }))
    expect(mode()).toHaveTextContent('light')

    act(() => setPrefersDark(false))
    act(() => setPrefersDark(true))

    expect(resolved()).toHaveTextContent('light')
  })

  it('volta a seguir o sistema quando o modo system é reativado', () => {
    setPrefersDark(true)
    renderProbe()

    fireEvent.click(screen.getByRole('button', { name: 'alternar' }))
    expect(resolved()).toHaveTextContent('light')

    fireEvent.click(screen.getByRole('button', { name: 'seguir sistema' }))

    expect(mode()).toHaveTextContent('system')
    expect(resolved()).toHaveTextContent('dark')
  })
})
