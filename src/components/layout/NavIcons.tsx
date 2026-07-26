import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function BaseIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconCaret({ open }: { open: boolean }) {
  return (
    <svg
      className={open ? undefined : undefined}
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="currentColor"
      aria-hidden
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
    >
      <path d="M6 3.5 11 8l-5 4.5V3.5Z" />
    </svg>
  )
}

/** Despesas / saída */
export function IconWallet(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 7h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      <path d="M3 7V5.5A2.5 2.5 0 0 1 5.5 3H17" />
      <circle cx="17" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  )
}

/** Receitas / entrada */
export function IconBank(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 10h18" />
      <path d="M5 10v8" />
      <path d="M9.5 10v8" />
      <path d="M14.5 10v8" />
      <path d="M19 10v8" />
      <path d="M3 18h18" />
      <path d="M12 3 3 8h18L12 3Z" />
    </BaseIcon>
  )
}

export function IconList(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 7h11" />
      <path d="M9 12h11" />
      <path d="M9 17h11" />
      <circle cx="5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="5" cy="17" r="1" fill="currentColor" stroke="none" />
    </BaseIcon>
  )
}

export function IconTags(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M3 12V5a1 1 0 0 1 1-1h7l9 9-8 8-9-9Z" />
      <circle cx="8" cy="8" r="1.25" />
    </BaseIcon>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M19.5 19a4 4 0 0 0-3.2-3.9" />
    </BaseIcon>
  )
}

/** Editar / lápis */
export function IconEdit(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 6.5 16.5 9.5" />
    </BaseIcon>
  )
}

/** Excluir / lixeira */
export function IconTrash(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6.5 7 7.5 19a1.5 1.5 0 0 0 1.5 1.4h6a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </BaseIcon>
  )
}

/** Marcar pago / check */
export function IconCheck(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </BaseIcon>
  )
}

/** Usuário (menu) */
export function IconUser(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </BaseIcon>
  )
}

/** Convite / e-mail */
export function IconMail(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 7 9-7" />
    </BaseIcon>
  )
}
