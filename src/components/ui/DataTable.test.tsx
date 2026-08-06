import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setViewportWidth } from '../../test/viewport'
import { DataTable, type DataTableColumn } from './DataTable'

interface Row {
  id: number
  nome: string
  valor: string
}

const data: Row[] = [{ id: 7, nome: 'Aluguel', valor: 'R$ 1.200,00' }]

const columns: DataTableColumn<Row>[] = [
  { key: 'id', header: 'ID', hideOnMobile: true, render: (row) => row.id },
  { key: 'nome', header: 'Nome', priority: 'primary', render: (row) => row.nome },
  { key: 'valor', header: 'Valor', priority: 'primary', render: (row) => row.valor },
  { key: 'status', header: 'Status', render: () => 'Pago' },
]

describe('DataTable', () => {
  it('renderiza a tabela no desktop', () => {
    setViewportWidth(1280)

    const { container } = render(<DataTable data={data} columns={columns} />)

    expect(container.querySelector('table')).not.toBeNull()
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('troca a tabela por cartões no mobile', () => {
    setViewportWidth(360)

    const { container } = render(<DataTable data={data} columns={columns} />)

    expect(container.querySelector('table')).toBeNull()
    expect(screen.getByText('Aluguel')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.200,00')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('omite colunas marcadas com hideOnMobile no modo card', () => {
    setViewportWidth(360)

    render(<DataTable data={data} columns={columns} />)

    expect(screen.queryByText('ID')).not.toBeInTheDocument()
    expect(screen.queryByText('7')).not.toBeInTheDocument()
  })

  it('mantém a tabela no mobile quando mobileMode é scroll', () => {
    setViewportWidth(360)

    const { container } = render(
      <DataTable data={data} columns={columns} mobileMode="scroll" />,
    )

    expect(container.querySelector('table')).not.toBeNull()
  })

  it('exibe a mensagem de vazio nos dois modos', () => {
    setViewportWidth(360)

    render(<DataTable data={[]} columns={columns} emptyMessage="Nada aqui." />)

    expect(screen.getByText('Nada aqui.')).toBeInTheDocument()
  })

  it('distribui colunas com a mesma largura por padrão (layout equal)', () => {
    setViewportWidth(1280)

    const { container } = render(<DataTable data={data} columns={columns} />)

    const cols = container.querySelectorAll('colgroup col')
    expect(cols).toHaveLength(4)
    expect(cols[0]?.getAttribute('style')).toContain('width: 25%')
    expect(cols[3]?.getAttribute('style')).toContain('width: 25%')
    expect(container.querySelector('table')?.className).toContain('tableEqual')
  })

  it('respeita larguras declaradas quando columnLayout é auto', () => {
    setViewportWidth(1280)

    const columnsWithWidth: DataTableColumn<Row>[] = [
      { key: 'nome', header: 'Nome', width: '22%', render: (row) => row.nome },
      { key: 'valor', header: 'Valor', width: '10%', align: 'right', render: (row) => row.valor },
    ]

    const { container } = render(
      <DataTable data={data} columns={columnsWithWidth} columnLayout="auto" />,
    )

    const cols = container.querySelectorAll('colgroup col')
    expect(cols).toHaveLength(2)
    expect(cols[0]?.getAttribute('style')).toContain('width: 22%')
    expect(cols[1]?.getAttribute('style')).toContain('width: 10%')
  })

  it('com loading não mostra empty state nem dados', () => {
    setViewportWidth(1280)

    render(
      <DataTable data={[]} columns={columns} loading emptyMessage="Nada aqui." />,
    )

    expect(screen.queryByText('Nada aqui.')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Carregando')).toBeInTheDocument()
    expect(screen.getByText('Nome')).toBeInTheDocument()
  })
})
