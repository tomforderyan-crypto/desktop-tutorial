import { useStudio } from '../../state/StudioContext'
import { Card, Label, Select, TextInput, Toggle } from '../../components/ui'
import type { WatermarkState } from '../../types'

const POSITIONS: WatermarkState['position'][] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

export default function WatermarkTab() {
  const { state, patch } = useStudio()
  const wm = state.watermark

  return (
    <div className="space-y-4">
      <Toggle checked={wm.visible} onChange={(v) => patch('watermark', { visible: v })} label="Show watermark on overlay" />
      <Card className="space-y-3 p-4">
        <div>
          <Label>Logo URL</Label>
          <TextInput placeholder="https://…" value={wm.logoUrl} onChange={(e) => patch('watermark', { logoUrl: e.target.value })} />
        </div>
        <div>
          <Label>Text</Label>
          <TextInput placeholder="@yourhandle" value={wm.text} onChange={(e) => patch('watermark', { text: e.target.value })} />
        </div>
        <div>
          <Label>Position</Label>
          <Select value={wm.position} onChange={(e) => patch('watermark', { position: e.target.value as WatermarkState['position'] })}>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>
                {p.replace('-', ' ')}
              </option>
            ))}
          </Select>
        </div>
      </Card>
    </div>
  )
}
