export type PapelMembro = 'DONO' | 'EDITOR' | 'LEITOR'

export interface MembroAmbiente {
  usuarioId: number
  nome: string
  papel: PapelMembro
}
