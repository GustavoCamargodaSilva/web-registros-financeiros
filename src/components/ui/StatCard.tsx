import styles from './StatCard.module.css'

type StatTone = 'neutral' | 'income' | 'expense'

interface StatCardProps {
  label: string
  value: string
  tone?: StatTone
}

export function StatCard({ label, value, tone = 'neutral' }: StatCardProps) {
  return (
    <div className={[styles.card, styles[tone]].filter(Boolean).join(' ')}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  )
}
