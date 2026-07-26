export interface Usuario {
  id: number
  nome: string
  sobrenome: string
  telefone: string
  email: string
}

export interface AuthResponse {
  accessToken: string
  expiresIn: number
  tokenType: string
}

export interface LoginRequest {
  login: string
  senha: string
}

export interface RegistroRequest {
  nome: string
  sobrenome: string
  telefone: string
  email: string
  senha: string
}
