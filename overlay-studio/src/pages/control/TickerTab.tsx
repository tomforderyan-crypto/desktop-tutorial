import { useStudio } from '../../state/StudioContext'
import { buildTickerItemsFromData } from '../../lib/dataSource'
import { id } from '../../lib/id'
import { Button, Card, Label, Select, TextInput, Toggle, NumberStepper } from '../../components/ui'

export default function TickerTab() {
  const { state, patch } = useStudio()
  const ticker = state.ticker

  const addManualItem = () => patch('ticker', { items: [...ticker.items, { id: id(), text: '' }] })
  const updateItem = (itemId: string, text: string) =>
    patch('ticker', { items: ticker.items.map((it) => (it.id === itemId ? { ...it, text } : it)) })
  const removeItem = (itemId: string) => patch('ticker', { items: ticker.items.filter((it) => it.id !== itemId) })

  const applyTemplate = () => patch('ticker', { items: buildTickerItemsFromData(state.rosterData, ticker.dataTemplate) })

  return (
    <div className="space-y-4">
      <Toggle checked={ticker.visible} onChange={(v) => patch('ticker', { visible: v })} label="Show ticker on overlay" />
      <Card className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        <div>
          <Label>Headline tag</Label>
          <TextInput placeholder="LIVE" value={ticker.headline} onChange={(e) => patch('ticker', { headline: e.target.value })} />
        </div>
        <NumberStepper label="Scroll speed (sec)" value={ticker.speedSec} min={5} max={90} step={5} onChange={(v) => patch('ticker', { speedSec: v })} />
        <div>
          <Label>Content source</Label>
          <Select value={ticker.source} onChange={(e) => patch('ticker', { source: e.target.value as 'manual' | 'data' })}>
            <option value="manual">Typed by hand</option>
            <option value="data">From data source</option>
          </Select>
        </div>
      </Card>

      {ticker.source === 'manual' ? (
        <Card className="space-y-2 p-4">
          {ticker.items.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No lines yet.</p>}
          {ticker.items.map((item) => (
            <div key={item.id} className="flex gap-2">
              <TextInput value={item.text} onChange={(e) => updateItem(item.id, e.target.value)} placeholder="Stat line…" />
              <Button variant="danger" size="sm" onClick={() => removeItem(item.id)}>
                Remove
              </Button>
            </div>
          ))}
          <Button size="sm" onClick={addManualItem}>
            + Add line
          </Button>
        </Card>
      ) : (
        <Card className="space-y-3 p-4">
          <div>
            <Label>Row template</Label>
            <TextInput
              placeholder="{name} — {carries} CAR, {yards} YDS"
              value={ticker.dataTemplate}
              onChange={(e) => patch('ticker', { dataTemplate: e.target.value })}
            />
            <p className="mt-1 text-xs text-[var(--color-text-dim)]">
              {'{field}'} pulls a column from your loaded data (Data Source tab) — one ticker line per row.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={applyTemplate} disabled={state.rosterData.length === 0}>
            Build {state.rosterData.length} line{state.rosterData.length === 1 ? '' : 's'} from data
          </Button>
        </Card>
      )}
    </div>
  )
}
