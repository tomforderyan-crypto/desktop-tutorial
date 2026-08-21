import { useParams } from 'react-router-dom'
import { useStudio } from '../state/StudioContext'
import Scoreboard from '../components/overlays/Scoreboard'
import WatermarkBug from '../components/overlays/WatermarkBug'
import PlayClock from '../components/overlays/PlayClock'
import StatTicker from '../components/overlays/StatTicker'

export default function OverlayPage() {
  const { kind } = useParams<{ kind: string }>()
  const { state } = useStudio()

  switch (kind) {
    case 'scoreboard':
      return (
        <div className="fixed left-6 top-6">
          <Scoreboard state={state.scoreboard} />
        </div>
      )
    case 'watermark':
      return <WatermarkBug state={state.watermark} />
    case 'playclock':
      return (
        <div className="fixed bottom-8 right-8">
          <PlayClock state={state.playClock} />
        </div>
      )
    case 'ticker':
      return <StatTicker state={state.ticker} />
    default:
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 font-mono text-white">
          Unknown overlay: {kind}
        </div>
      )
  }
}
