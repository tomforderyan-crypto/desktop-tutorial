import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'approve' | 'reject'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-led)] text-[var(--color-bg)] font-semibold hover:brightness-110',
  secondary: 'bg-[var(--color-surface-alt)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
  approve: 'bg-[var(--color-good)] text-[#06210f] font-semibold hover:brightness-110',
  reject: 'border border-[var(--color-bad)]/50 text-[var(--color-bad)] hover:bg-[var(--color-bad)]/15',
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-lg px-4 py-2.5 transition disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-semibold">
        {label} {hint && <span className="font-normal text-[var(--color-text-muted)]">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function TextInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 placeholder:text-[var(--color-text-muted)]/70 focus:border-[var(--color-led)] focus:outline-none ${className}`}
      {...props}
    />
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text-muted)]">{children}</div>
}

export function Page({ children }: { children: ReactNode }) {
  return <main className="mx-auto grid w-full max-w-5xl gap-7 px-4 pt-7 pb-16">{children}</main>
}

export function Brand() {
  return (
    <h1 className="font-display text-3xl font-black leading-none">
      Photo <span className="text-[var(--color-led)]">Wall</span>
    </h1>
  )
}
