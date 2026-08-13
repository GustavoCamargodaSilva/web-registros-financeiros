import { Card } from '../components/ui/Card'
import { formatCurrency, formatDate } from '../utils/format'
import type { Despesa } from '../types/despesa.types'
import type { Receita } from '../types/receita.types'
import styles from './HomeRanking.module.css'

interface HomeContasPendentesProps {
  despesas: Despesa[]
  receitas: Receita[]
}

export function HomeContasPendentes({ despesas, receitas }: HomeContasPendentesProps) {
  const totalPagar = despesas.reduce((acc, item) => acc + item.valor, 0)
  const totalReceber = receitas.reduce((acc, item) => acc + item.valor, 0)

  return (
    <>
      <Card>
        <h2 className={styles.sectionTitle}>Contas a pagar</h2>
        {despesas.length === 0 ? (
          <p className={styles.empty}>Nenhuma despesa pendente.</p>
        ) : (
          <>
            <p className={styles.hint}>Em aberto: {formatCurrency(totalPagar)}</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.vencimento)}</td>
                    <td>{item.descricao}</td>
                    <td className={styles.moneyExpense}>{formatCurrency(item.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Contas a receber</h2>
        {receitas.length === 0 ? (
          <p className={styles.empty}>Nenhuma receita pendente.</p>
        ) : (
          <>
            <p className={styles.hint}>Em aberto: {formatCurrency(totalReceber)}</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Pagador</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {receitas.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.dataPagamento)}</td>
                    <td>{item.pagadorDescricao}</td>
                    <td className={styles.moneyIncome}>{formatCurrency(item.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>
    </>
  )
}
