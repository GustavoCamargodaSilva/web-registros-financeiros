import { describe, expect, it } from 'vitest'
import { SENHA_MAX_LENGTH, SENHA_MIN_LENGTH, validarSenha } from './senha'

describe('validarSenha', () => {
  it('rejeita senha com menos de 12 caracteres', () => {
    expect(validarSenha('curta')).toContain(String(SENHA_MIN_LENGTH))
  })

  it('rejeita senha com mais de 128 caracteres', () => {
    expect(validarSenha('a'.repeat(SENHA_MAX_LENGTH + 1))).toContain(String(SENHA_MAX_LENGTH))
  })

  it('aceita senha entre 12 e 128 caracteres', () => {
    expect(validarSenha('a'.repeat(SENHA_MIN_LENGTH))).toBeNull()
    expect(validarSenha('a'.repeat(SENHA_MAX_LENGTH))).toBeNull()
  })
})
