import type { ReactNode } from 'react'
import styles from './DataTable.module.css'

export interface DataTableColumn<T> {
  key: string
  header: string
  align?: 'left' | 'right'
  /** Largura da coluna (ex.: '120px', '14%'). */
  width?: string
  /** Trunca texto longo com reticências. */
  truncate?: boolean
  /** Tooltip nativo (útil com truncate). */
  title?: (row: T) => string | undefined
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  emptyMessage?: string
}

function cellClassName<T>(column: DataTableColumn<T>) {
  return [
    column.align === 'right' ? styles.alignRight : '',
    column.truncate ? styles.truncate : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'Nenhum registro encontrado.',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <colgroup>
          {columns.map((column) => (
            <col key={column.key} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={cellClassName(column) || undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cellClassName(column) || undefined}
                  title={column.title?.(row)}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
