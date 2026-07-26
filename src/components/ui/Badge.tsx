import styles from './Badge.module.css'

interface BadgeProps {
  paid: boolean
}

export function Badge({ paid }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${paid ? styles.success : styles.warning}`}>
      {paid ? 'Pago' : 'Pendente'}
    </span>
  )
}
