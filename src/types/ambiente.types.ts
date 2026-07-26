import type { PapelMembro } from './membro.types'

export interface Ambiente {
  id: number
  nome: string
  papel: PapelMembro
}
