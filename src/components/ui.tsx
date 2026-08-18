import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import type { ContentFormat, Platform } from '../types'
import { PLATFORM_LABELS } from '../types'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 ${className}`}
      {...props}
    />
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold">{title}</h2>
      {action}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-[var(--color-accent)] text-white active:bg-[var(--color-accent-soft)]',
    secondary: 'bg-[var(--color-surface-alt)] text-[var(--color-text)] border border-[var(--color-border)]',
    ghost: 'text-[var(--color-text-muted)]',
    danger: 'bg-red-950 text-red-300 border border-red-900',
  }
  return (
    <button
      className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function FormatPill({ format }: { format: ContentFormat }) {
  const isShort = format === 'short'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isShort ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isShort ? 'bg-emerald-400' : 'bg-blue-400'}`} />
      {isShort ? 'Short' : 'Long'}
    </span>
  )
}

export function PlatformPill({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
      {PLATFORM_LABELS[platform]}
    </span>
  )
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="max-w-xs text-sm text-[var(--color-text-muted)]">{body}</p>
      {action}
    </Card>
  )
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 md:items-center" onClick={onClose}>
      <div
        className="safe-bottom max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:rounded-2xl md:border"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function Select({
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] ${className}`}
      {...props}
    />
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] ${className}`}
      {...props}
    />
  )
}
