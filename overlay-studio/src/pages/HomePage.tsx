import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { OverlayKind } from '../types'
import { buildOverlayUrl } from '../lib/overlayUrl'
import { useBodyShell } from '../lib/useBodyShell'
import { Button, Card, SectionTitle } from '../components/ui'

const OVERLAYS: { kind: OverlayKind; title: string; blurb: string }[] = [
  { kind: 'scoreboard', title: 'Scoreboard', blurb: 'Team names, logos, score, period, clock, down & distance.' },
  { kind: 'watermark', title: 'Watermark / Bug', blurb: 'Corner logo or text, always on screen.' },
  { kind: 'playclock', title: 'Play Clock', blurb: 'A running countdown you start/pause/reset from the control panel.' },
  { kind: 'ticker', title: 'Stat Ticker', blurb: 'Scrolling stat line, typed by hand or built from your data source.' },
]

function CopyUrlRow({ kind }: { kind: OverlayKind }) {
  const url = buildOverlayUrl(kind)
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded bg-[var(--color-bg)] px-2 py-1.5 text-xs text-[var(--color-text-muted)]">{url}</code>
      <Button
        size="sm"
        onClick={async () => {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  )
}

export default function HomePage() {
  useBodyShell()
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <SectionTitle
        action={
          <Link to="/control">
            <Button variant="primary">Open Control Panel</Button>
          </Link>
        }
      >
        Overlay Studio
      </SectionTitle>
      <p className="mb-8 max-w-xl text-sm text-[var(--color-text-muted)]">
        Custom broadcast overlays you control live. Add each overlay's URL below to OBS (or vMix/eCamm) as a
        transparent Browser Source, then drive everything — scores, clock, ticker — from the Control Panel while
        you're live.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {OVERLAYS.map((o) => (
          <Card key={o.kind} className="p-4">
            <div className="mb-1 font-display text-xl font-semibold text-[var(--color-text)]">{o.title}</div>
            <p className="mb-3 text-sm text-[var(--color-text-muted)]">{o.blurb}</p>
            <CopyUrlRow kind={o.kind} />
          </Card>
        ))}
      </div>
    </div>
  )
}
