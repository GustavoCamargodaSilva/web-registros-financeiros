import { ANO_BASE } from '../../constants/competencia'
import { useCompetencia } from '../../context/CompetenciaContext'
import { MESES_CURTOS } from '../../utils/format'
import styles from './CompetenciaSelector.module.css'

export function CompetenciaSelector() {
  const { ano, mes, setAno, setMes } = useCompetencia()
  const podeVoltar = ano > ANO_BASE

  return (
    <div className={styles.wrap}>
      <div className={styles.yearNav} role="group" aria-label="Ano da competência">
        <button
          type="button"
          className={styles.yearArrow}
          aria-label="Ano anterior"
          disabled={!podeVoltar}
          onClick={() => setAno(ano - 1)}
        >
          ←
        </button>
        <span className={styles.yearDisplay} aria-live="polite">
          {ano}
        </span>
        <button
          type="button"
          className={styles.yearArrow}
          aria-label="Próximo ano"
          onClick={() => setAno(ano + 1)}
        >
          →
        </button>
      </div>

      <div className={styles.months} role="group" aria-label="Mês da competência">
        {MESES_CURTOS.map((month) => {
          const active = month.value === mes
          return (
            <button
              key={month.value}
              type="button"
              className={[styles.pill, active ? styles.pillActive : ''].filter(Boolean).join(' ')}
              aria-pressed={active}
              onClick={() => setMes(month.value)}
            >
              {month.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
