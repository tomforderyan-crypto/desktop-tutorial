import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Brand, Button, Field, Notice, Page, TextInput } from '../components/ui'
import { isPhoto, MAX_FILES } from '../lib/image'
import { sendPhoto } from '../lib/photos'

interface Picked {
  file: File
  url: string
}

export default function SubmitPage() {
  const [picked, setPicked] = useState<Picked[]>([])
  const [caption, setCaption] = useState('')
  const [credit, setCredit] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const [problem, setProblem] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const pickedRef = useRef(picked)

  useEffect(() => {
    pickedRef.current = picked
  }, [picked])
  useEffect(() => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])

  function addFiles(list: FileList | null) {
    if (!list) return
    const files = [...list].filter(isPhoto)
    const room = MAX_FILES - picked.length
    setProblem(
      files.length < list.length
        ? 'Some files were skipped because they aren’t photos.'
        : files.length > room
          ? `You can send ${MAX_FILES} photos at a time.`
          : '',
    )
    setStatus('')
    setPicked((prev) => [...prev, ...files.slice(0, Math.max(0, room)).map((file) => ({ file, url: URL.createObjectURL(file) }))])
  }

  function removeAt(i: number) {
    URL.revokeObjectURL(picked[i].url)
    setPicked((prev) => prev.filter((_, j) => j !== i))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!picked.length || sending) return
    setSending(true)
    setProblem('')
    const batch = picked
    let sent = 0
    const failures: string[] = []
    for (let i = 0; i < batch.length; i++) {
      setStatus(`Sending ${i + 1} of ${batch.length}…`)
      try {
        await sendPhoto(batch[i].file, caption.trim(), credit.trim())
        sent++
      } catch (err) {
        failures.push(err instanceof Error ? err.message : 'A photo didn’t send. Try again.')
      }
    }
    batch.forEach((p) => URL.revokeObjectURL(p.url))
    setPicked([])
    setSending(false)
    if (sent) setCaption('')
    setStatus(sent ? `${sent === 1 ? 'Photo' : `${sent} photos`} sent. ${sent === 1 ? 'It' : 'They'}’ll show on the big screen once approved.` : '')
    setProblem(failures[0] ?? '')
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <Page>
      <div className="mx-auto grid w-full max-w-xl gap-7">
        <Brand />
        <div>
          <h2 className="font-display text-4xl font-extrabold leading-none text-balance">Get your photo on the big screen</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">Send a photo and it’s checked before it goes up on the Jumbotron.</p>
        </div>

        <form className="grid gap-5" onSubmit={onSubmit}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`grid cursor-pointer justify-items-center gap-1 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition ${
              dragging ? 'border-[var(--color-led)] bg-[var(--color-surface-alt)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'
            }`}
          >
            <span className="font-display text-2xl font-extrabold">Choose photos</span>
            <span className="text-sm text-[var(--color-text-muted)]">Or drag them here. Up to {MAX_FILES} at a time.</span>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {picked.length > 0 && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {picked.map((p, i) => (
                <figure key={p.url} className="relative aspect-square overflow-hidden rounded-lg bg-[var(--color-surface-alt)]">
                  <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label={`Remove ${p.file.name}`}
                    onClick={() => removeAt(i)}
                    className="absolute top-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-lg leading-none"
                  >
                    ×
                  </button>
                </figure>
              ))}
            </div>
          )}

          <Field label="Caption" hint="(optional)">
            <TextInput value={caption} maxLength={100} onChange={(e) => setCaption(e.target.value)} placeholder="Senior night, section 104" />
          </Field>
          <Field label="Your name" hint="(optional, shown with your photo)">
            <TextInput value={credit} maxLength={40} onChange={(e) => setCredit(e.target.value)} placeholder="Jordan R." />
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" type="submit" disabled={!picked.length || sending}>
              {sending ? 'Sending…' : 'Send for approval'}
            </Button>
            <span role="status" className="text-sm text-[var(--color-text-muted)]">
              {status}
            </span>
          </div>
          {problem && <Notice>{problem}</Notice>}
        </form>

        <Link to="/review" className="justify-self-start text-sm text-[var(--color-text-muted)] underline-offset-4 hover:underline">
          Wall admin sign-in
        </Link>
      </div>
    </Page>
  )
}
