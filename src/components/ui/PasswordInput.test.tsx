import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PasswordInput } from './PasswordInput'

describe('PasswordInput', () => {
  it('alterna visibilidade da senha ao clicar no olho', () => {
    render(<PasswordInput label="Senha" name="senha" defaultValue="segredo" />)

    const input = screen.getByLabelText('Senha')
    expect(input).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(input).toHaveAttribute('type', 'password')
  })
})
