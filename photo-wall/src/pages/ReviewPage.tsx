import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { Brand, Button, Field, Notice, Page, TextInput } from '../components/ui'
import { supabase } from '../lib/supabase'
import { approvePhoto, deletePhoto, photoUrl, saveSettings, useWall, type Photo, type WallSettings } from '../lib/photos'

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  return new Date(iso).toLocaleDateString()
}

export default function ReviewPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecked(true)
    })
    const { data } = supabase!.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <Page>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Brand />
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded-full border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-text-muted)]" to="/">
            Send page
          </Link>
          <Link className="rounded-full border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-text-muted)]" to="/display">
            Display
          </Link>
          {session && (
            <button className="rounded-full border border-[var(--color-border)] px-3 py-1.5 hover:border-[var(--color-text-muted)]" onClick={() => supabase!.auth.signOut()}>
              Sign out
            </button>
          )}
        </nav>
      </header>
      {!checked ? null : session ? <Queue session={session} /> : <SignIn />}
    </Page>
  )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setProblem('')
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setProblem('That email and password didn’t work. Use the account you created in Supabase for the wall admin.')
  }

  return (
    <form className="grid w-full max-w-sm gap-4" onSubmit={onSubmit}>
      <div>
        <h2 className="font-display text-4xl font-extrabold leading-none">Admin sign-in</h2>
        <p className="mt-2 text-[var(--color-text-muted)]">Sign in to approve photos before they reach the screen.</p>
      </div>
      <Field label="Email">
        <TextInput type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Password">
        <TextInput type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      <Button variant="primary" type="submit" disabled={busy} className="justify-self-start">
        {busy ? 'Signing in…' : 'Sign in'}
      </Button>
      {problem && <Notice>{problem}</Notice>}
    </form>
  )
}

function Queue({ session }: { session: Session }) {
  const { photos, settings, setSettings, loaded } = useWall(session.user.id)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [armed, setArmed] = useState<string | null>(null)
  const [problem, setProblem] = useState('')

  useEffect(() => {
    supabase!.rpc('is_wall_admin').then(({ data, error }) => setIsAdmin(error ? false : data === true))
  }, [session.user.id])

  const pending = photos.filter((p) => p.status === 'pending')
  const approved = photos
    .filter((p) => p.status === 'approved')
    .sort((a, b) => (b.approved_at ?? '').localeCompare(a.approved_at ?? ''))

  async function act(photo: Photo, fn: (p: Photo) => Promise<void>, failMsg: string) {
    setBusy((s) => new Set(s).add(photo.id))
    setProblem('')
    try {
      await fn(photo)
    } catch {
      setProblem(failMsg)
    } finally {
      setBusy((s) => {
        const next = new Set(s)
        next.delete(photo.id)
        return next
      })
    }
  }
  const approve = (p: Photo) => act(p, (x) => approvePhoto(x.id), 'Couldn’t approve that photo. Try again.')
  const reject = (p: Photo) => act(p, deletePhoto, 'Couldn’t reject that photo. Try again.')

  // A / R act on the oldest waiting photo.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input, select, textarea')) return
      const first = pending.find((p) => !busy.has(p.id))
      if (!first) return
      if (e.key === 'a' || e.key === 'A') approve(first)
      if (e.key === 'r' || e.key === 'R') reject(first)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function updateSettings(patch: Partial<WallSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next).catch(() => setProblem('Couldn’t save the display settings.'))
  }

  if (isAdmin === false) {
    return (
      <Notice>
        <strong className="text-[var(--color-text)]">{session.user.email} can’t approve photos.</strong> Add this email to the{' '}
        <code>wall_admins</code> table in Supabase (the last line of <code>supabase/setup.sql</code>), then reload.
      </Notice>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-none">Review queue</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">Nothing reaches the screen until you approve it.</p>
        </div>
        <div className="flex gap-2.5">
          <Stat value={pending.length} label="Waiting" />
          <Stat value={approved.length} label="On the wall" />
        </div>
      </div>
      {problem && <Notice>{problem}</Notice>}

      <section className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-extrabold tracking-wider text-[var(--color-text-muted)]">Waiting for you</h3>
          <span className="text-sm text-[var(--color-text-muted)]">Shortcuts: A approves the oldest photo, R rejects it</span>
        </div>
        {pending.length === 0 ? (
          <Empty>{loaded ? 'All caught up. New photos appear here the moment someone sends one.' : 'Loading the queue…'}</Empty>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {pending.map((p) => (
              <article key={p.id} className="grid grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <img src={photoUrl(p.path)} alt={p.caption || 'Submitted photo'} loading="lazy" className="aspect-[4/3] w-full bg-black object-contain" />
                <div className="grid min-w-0 gap-0.5 px-3 py-2.5">
                  {p.caption && <div className="break-words">{p.caption}</div>}
                  <div className="text-sm break-words text-[var(--color-text-muted)]">
                    {p.credit || 'No name'} · {ago(p.created_at)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                  <Button variant="approve" disabled={busy.has(p.id)} onClick={() => approve(p)}>
                    Approve
                  </Button>
                  <Button variant="reject" disabled={busy.has(p.id)} onClick={() => reject(p)}>
                    Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <h3 className="font-display text-xl font-extrabold tracking-wider text-[var(--color-text-muted)]">Display settings</h3>
        <div className="grid gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
          <Field label="Swap a tile every">
            <select
              value={settings.seconds}
              onChange={(e) => updateSettings({ seconds: Number(e.target.value) })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
            >
              {[3, 5, 8, 12].map((n) => (
                <option key={n} value={n}>
                  {n} seconds
                </option>
              ))}
            </select>
          </Field>
          <div className="grid content-end gap-2.5">
            <Check checked={settings.captions} onChange={(v) => updateSettings({ captions: v })} label="Show captions and names on tiles" />
            <Check checked={settings.spotlight} onChange={(v) => updateSettings({ spotlight: v })} label="Spotlight each newly approved photo full screen" />
            <Check checked={settings.show_qr} onChange={(v) => updateSettings({ show_qr: v })} label="Show a “send your photo” QR code on screen" />
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-extrabold tracking-wider text-[var(--color-text-muted)]">On the wall</h3>
          <span className="text-sm text-[var(--color-text-muted)]">Removing a photo takes it off the screen right away.</span>
        </div>
        {approved.length === 0 ? (
          <Empty>No photos on the wall yet. Approve one above and it shows up here and on the display.</Empty>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
            {approved.map((p) => (
              <div key={p.id} className="grid gap-1.5">
                <img
                  src={photoUrl(p.path)}
                  alt={p.caption || 'Wall photo'}
                  title={[p.caption, p.credit].filter(Boolean).join(' · ')}
                  loading="lazy"
                  className="aspect-square w-full rounded-lg bg-[var(--color-surface-alt)] object-cover"
                />
                <Button
                  variant="reject"
                  className={`py-1.5 text-sm ${armed === p.id ? '!bg-[var(--color-bad)] !text-white' : ''}`}
                  disabled={busy.has(p.id)}
                  onClick={() => {
                    if (armed !== p.id) {
                      setArmed(p.id)
                      setTimeout(() => setArmed((a) => (a === p.id ? null : a)), 3000)
                      return
                    }
                    setArmed(null)
                    act(p, deletePhoto, 'Couldn’t remove that photo. Try again.')
                  }}
                >
                  {armed === p.id ? 'Tap to confirm' : 'Remove'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid min-w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
      <b className="font-display text-4xl font-black leading-none text-[var(--color-led)] tabular-nums">{value}</b>
      <span className="text-xs tracking-wider text-[var(--color-text-muted)] uppercase">{label}</span>
    </div>
  )
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-[var(--color-text-muted)]">{children}</div>
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5">
      <input type="checkbox" className="h-4.5 w-4.5 accent-[var(--color-led)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
