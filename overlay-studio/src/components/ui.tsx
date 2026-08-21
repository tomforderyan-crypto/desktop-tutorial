import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}>{children}</div>
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-soft)] font-semibold',
  secondary: 'bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border-bright)] hover:border-[var(--color-accent)]',
  ghost: 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]',
  danger: 'bg-[var(--color-bad)]/15 text-[var(--color-bad)] border border-[var(--color-bad)]/40 hover:bg-[var(--color-bad)]/25',
}

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-5 py-3.5 text-base',
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  )
}

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5 ${className}`} {...props} />
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-[var(--color-border-bright)] bg-[var(--color-bg)] px-3 py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none ${className}`}
      {...props}
    />
  )
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-md border border-[var(--color-border-bright)] bg-[var(--color-bg)] px-3 py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none font-mono text-sm ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-[var(--color-border-bright)] bg-[var(--color-bg)] px-3 py-2.5 text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none ${className}`}
      {...props}
    />
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-md border border-[var(--color-border-bright)] bg-[var(--color-bg)] px-3 py-2.5"
    >
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-bright)]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'bad' | 'accent' }) {
  const toneClasses = {
    neutral: 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]',
    good: 'bg-[var(--color-good)]/15 text-[var(--color-good)]',
    bad: 'bg-[var(--color-bad)]/15 text-[var(--color-bad)]',
    accent: 'bg-[var(--color-accent)]/15 text-[var(--color-accent-soft)]',
  }[tone]
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${toneClasses}`}>{children}</span>
}

export function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
}) {
  const clamp = (v: number) => {
    let n = v
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)
    return n
  }
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" className="font-mono" onClick={() => onChange(clamp(value - step))}>
          −
        </Button>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="w-16 rounded-md border border-[var(--color-border-bright)] bg-[var(--color-bg)] px-2 py-2 text-center font-mono text-[var(--color-text)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <Button type="button" size="sm" className="font-mono" onClick={() => onChange(clamp(value + step))}>
          +
        </Button>
      </div>
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-2xl font-semibold tracking-wide text-[var(--color-text)]">{children}</h2>
      {action}
    </div>
  )
}
