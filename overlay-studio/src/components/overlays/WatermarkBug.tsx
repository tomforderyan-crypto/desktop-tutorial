import type { WatermarkState } from '../../types'

const POSITION_CLASSES: Record<WatermarkState['position'], string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
}

export default function WatermarkBug({ state }: { state: WatermarkState }) {
  if (!state.visible) return null
  return (
    <div className={`fixed ${POSITION_CLASSES[state.position]} flex items-center gap-2 rounded-md bg-black/70 px-3 py-1.5 shadow-xl backdrop-blur-sm`}>
      {state.logoUrl && <img src={state.logoUrl} alt="" className="h-6 w-6 object-contain" />}
      {state.text && <span className="font-display text-base font-semibold tracking-wide text-white">{state.text}</span>}
    </div>
  )
}
