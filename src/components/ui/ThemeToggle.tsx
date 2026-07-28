import { useTheme } from '../../context/ThemeContext'
import { IconMoon, IconSun } from '../layout/NavIcons'
import { Button } from './Button'

interface ThemeToggleProps {
  /** `ghost` para o header azul, `outline` para superfícies claras. */
  variant?: 'ghost' | 'outline'
}

export function ThemeToggle({ variant = 'ghost' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </Button>
  )
}
