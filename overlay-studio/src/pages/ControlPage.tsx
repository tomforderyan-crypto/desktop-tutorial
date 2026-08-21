import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBodyShell } from '../lib/useBodyShell'
import { buildOverlayUrl } from '../lib/overlayUrl'
import { Button, Card, SectionTitle } from '../components/ui'
import type { OverlayKind } from '../types'
import ScoreboardTab from './control/ScoreboardTab'
import WatermarkTab from './control/WatermarkTab'
import PlayClockTab from './control/PlayClockTab'
import TickerTab from './control/TickerTab'
import DataSourceTab from './control/DataSourceTab'

type Tab = 'scoreboard' | 'watermark' | 'playclock' | 'ticker' | 'data'

const TABS: { key: Tab; label: string; overlay?: OverlayKind }[] = [
  { key: 'scoreboard', label: 'Scoreboard', overlay: 'scoreboard' },
  { key: 'watermark', label: 'Watermark', overlay: 'watermark' },
  { key: 'playclock', label: 'Play Clock', overlay: 'playclock' },
  { key: 'ticker', label: 'Stat Ticker', overlay: 'ticker' },
  { key: 'data', label: 'Data Source' },
]

export default function ControlPage() {
  useBodyShell()
  const [tab, setTab] = useState<Tab>('scoreboard')
  const active = TABS.find((t) => t.key === tab)!

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <SectionTitle
        action={
          <Link to="/">
            <Button variant="ghost" size="sm">
              ← Overlays
            </Button>
          </Link>
        }
      >
        Control Panel
      </SectionTitle>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key} variant={t.key === tab ? 'primary' : 'secondary'} size="sm" onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {active.overlay && (
        <Card className="mb-5 flex items-center justify-between gap-3 p-3">
          <span className="text-xs text-[var(--color-text-muted)]">Browser Source URL for this overlay</span>
          <div className="flex items-center gap-2">
            <code className="max-w-72 truncate rounded bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text)]">
              {buildOverlayUrl(active.overlay)}
            </code>
            <Button size="sm" onClick={() => navigator.clipboard.writeText(buildOverlayUrl(active.overlay!))}>
              Copy
            </Button>
          </div>
        </Card>
      )}

      {tab === 'scoreboard' && <ScoreboardTab />}
      {tab === 'watermark' && <WatermarkTab />}
      {tab === 'playclock' && <PlayClockTab />}
      {tab === 'ticker' && <TickerTab />}
      {tab === 'data' && <DataSourceTab />}
    </div>
  )
}
