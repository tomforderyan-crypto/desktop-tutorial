import { useStudio } from '../../state/StudioContext'
import { computeRemaining } from '../../lib/playClock'
import { Button, Card, NumberStepper, Toggle } from '../../components/ui'
import PlayClock from '../../components/overlays/PlayClock'

export default function PlayClockTab() {
  const { state, patch } = useStudio()
  const pc = state.playClock

  const start = () => patch('playClock', { running: true, secondsRemaining: computeRemaining(pc), updatedAt: Date.now() })
  const pause = () => patch('playClock', { running: false, secondsRemaining: computeRemaining(pc), updatedAt: Date.now() })
  const reset = () => patch('playClock', { running: false, secondsRemaining: pc.duration, updatedAt: Date.now() })

  return (
    <div className="space-y-4">
      <Toggle checked={pc.visible} onChange={(v) => patch('playClock', { visible: v })} label="Show play clock on overlay" />
      <Card className="flex flex-wrap items-center gap-6 p-4">
        <PlayClock state={pc} />
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <NumberStepper
            label="Duration (sec)"
            value={pc.duration}
            min={5}
            max={120}
            step={5}
            onChange={(v) => patch('playClock', { duration: v, ...(pc.running ? {} : { secondsRemaining: v }) })}
          />
          <Button variant="primary" onClick={start} disabled={pc.running}>
            Start
          </Button>
          <Button onClick={pause} disabled={!pc.running}>
            Pause
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
        </div>
      </Card>
    </div>
  )
}
