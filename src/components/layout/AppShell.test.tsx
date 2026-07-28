import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../../context/AuthContext'
import { setViewportWidth } from '../../test/viewport'
import { ToastProvider } from '../toast/ToastProvider'
import { AppShell } from './AppShell'

vi.mock('../../api/ambientes.api', () => ({
  ambientesApi: {
    listar: vi.fn().mockResolvedValue([]),
    listarMembrosAtivo: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../api/auth.api', () => ({
  authApi: {
    me: vi.fn().mockResolvedValue(null),
    login: vi.fn(),
    logout: vi.fn(),
    registro: vi.fn(),
  },
}))

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/categorias']}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/categorias" element={<div>Conteúdo da página</div>} />
              <Route path="/despesas" element={<div>Despesas</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  it('no desktop mostra a sidebar fixa e nenhum botão de menu', async () => {
    setViewportWidth(1280)
    renderShell()
    await screen.findByText('Conteúdo da página')

    expect(screen.queryByRole('button', { name: 'Abrir menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument()
  })

  it('no mobile esconde o menu até o toque no hambúrguer', async () => {
    setViewportWidth(360)
    renderShell()
    await screen.findByText('Conteúdo da página')

    expect(screen.queryByRole('navigation', { name: 'Menu principal' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    expect(screen.getByRole('dialog', { name: 'Menu principal' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Menu principal' })).toBeInTheDocument()
  })

  it('fecha o drawer ao escolher um item do menu', async () => {
    setViewportWidth(360)
    renderShell()
    await screen.findByText('Conteúdo da página')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    fireEvent.click(screen.getByRole('link', { name: 'Categorias' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fecha o drawer com Escape', async () => {
    setViewportWidth(360)
    renderShell()
    await screen.findByText('Conteúdo da página')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
