import { memo, type ReactNode } from 'react'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import styles from './DataTable.module.css'

/**
 * Peso da coluna no modo card (abaixo de 900px):
 * - `primary`: vira o destaque no topo do cartão
 * - `secondary`: par rótulo/valor no corpo (padrão)
 * - `low`: mesmo tratamento do secondary, porém sempre por último
 * - `actions`: rodapé do cartão, sem rótulo
 */
export type DataTableColumnPriority = 'primary' | 'secondary' | 'low' | 'actions'

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
  /** Peso no modo card. Não afeta a tabela do desktop. */
  priority?: DataTableColumnPriority
  /** Omite a coluna no modo card, mantendo-a na tabela do desktop. */
  hideOnMobile?: boolean
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  emptyMessage?: string
  getRowKey?: (row: T, index: number) => string | number
  /**
   * Comportamento abaixo de 900px. `cards` reorganiza cada linha num cartão;
   * `scroll` mantém a tabela com rolagem horizontal.
   */
  mobileMode?: 'cards' | 'scroll'
  /** Quando true, mostra skeleton em vez de empty state ou dados. */
  loading?: boolean
}

const SKELETON_ROWS = 5

function cellClassName<T>(column: DataTableColumn<T>) {
  return [
    column.align === 'right' ? styles.alignRight : '',
    column.truncate ? styles.truncate : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function sortDetails<T>(columns: DataTableColumn<T>[]) {
  return [
    ...columns.filter((column) => column.priority !== 'low'),
    ...columns.filter((column) => column.priority === 'low'),
  ]
}

function DataTableSkeleton<T>({
  columns,
  mobileMode,
  isMobile,
}: {
  columns: DataTableColumn<T>[]
  mobileMode: 'cards' | 'scroll'
  isMobile: boolean
}) {
  if (isMobile && mobileMode === 'cards') {
    return (
      <ul className={styles.cards} aria-busy="true" aria-label="Carregando">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <li key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={`skeleton ${styles.skeletonPrimary}`} />
              <span className={`skeleton ${styles.skeletonSecondary}`} />
            </div>
            <div className={styles.cardBody}>
              <span className={`skeleton ${styles.skeletonLine}`} />
              <span className={`skeleton ${styles.skeletonLineShort}`} />
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const wrapperClass = [styles.wrapper, mobileMode === 'scroll' ? styles.wrapperHint : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClass} aria-busy="true" aria-label="Carregando">
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
          {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column.key} className={cellClassName(column) || undefined}>
                  <span className={`skeleton ${styles.skeletonCell}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DataTableInner<T>({
  columns,
  data,
  emptyMessage = 'Nenhum registro encontrado.',
  getRowKey,
  mobileMode = 'cards',
  loading = false,
}: DataTableProps<T>) {
  const { isMobile } = useBreakpoint()

  if (loading) {
    return <DataTableSkeleton columns={columns} mobileMode={mobileMode} isMobile={isMobile} />
  }

  if (data.length === 0) {
    return <div className={styles.empty}>{emptyMessage}</div>
  }

  const rowKey = getRowKey ?? ((_row: T, index: number) => index)

  if (isMobile && mobileMode === 'cards') {
    const visible = columns.filter((column) => !column.hideOnMobile)
    const primary = visible.filter((column) => column.priority === 'primary')
    const actions = visible.filter((column) => column.priority === 'actions')
    const details = sortDetails(
      visible.filter(
        (column) => column.priority !== 'primary' && column.priority !== 'actions',
      ),
    )

    return (
      <ul className={styles.cards}>
        {data.map((row, index) => (
          <li key={rowKey(row, index)} className={styles.card}>
            {primary.length > 0 ? (
              <div className={styles.cardHeader}>
                {primary.map((column) => (
                  <span
                    key={column.key}
                    className={styles.cardHeadline}
                    title={column.title?.(row)}
                  >
                    {column.render(row)}
                  </span>
                ))}
              </div>
            ) : null}

            {details.length > 0 ? (
              <dl className={styles.cardBody}>
                {details.map((column) => (
                  <div key={column.key} className={styles.cardRow}>
                    <dt className={styles.cardLabel}>{column.header}</dt>
                    <dd className={styles.cardValue} title={column.title?.(row)}>
                      {column.render(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {actions.length > 0 ? (
              <div className={styles.cardActions}>
                {actions.map((column) => (
                  <div key={column.key}>{column.render(row)}</div>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    )
  }

  const wrapperClass = [styles.wrapper, mobileMode === 'scroll' ? styles.wrapperHint : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrapperClass}>
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
            <tr key={rowKey(row, index)}>
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

export const DataTable = memo(DataTableInner) as typeof DataTableInner
