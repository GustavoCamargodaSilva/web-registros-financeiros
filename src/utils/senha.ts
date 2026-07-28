export const SENHA_MIN_LENGTH = 12
export const SENHA_MAX_LENGTH = 128

export function validarSenha(senha: string): string | null {
  if (senha.length < SENHA_MIN_LENGTH) {
    return `Senha deve ter no mínimo ${SENHA_MIN_LENGTH} caracteres`
  }
  if (senha.length > SENHA_MAX_LENGTH) {
    return `Senha deve ter no máximo ${SENHA_MAX_LENGTH} caracteres`
  }
  return null
}
