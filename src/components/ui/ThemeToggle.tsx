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

  /*
   * Rótulo e ícone descrevem a ação, não o estado atual. Combinar os dois
   * (aria-pressed com um rótulo de ação) faria o leitor de tela anunciar
   * "Ativar tema claro, pressionado", que é contraditório.
   */
  const label = isDark ? 'Ativar tema claro' : 'Ativar tema escuro'

  return (
    <Button
      type="button"
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? <IconSun /> : <IconMoon />}
    </Button>
  )
}
