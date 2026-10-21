import { useEffect, useMemo, useRef, useState } from 'react'
import qrcode from 'qrcode-generator'
import { photoUrl, useWall, type Photo } from '../lib/photos'

const SPOTLIGHT_MS = 7000

/** Grid shape for `count` photos on a `w`×`h` screen: tiles stay roughly square, at most ~3 rows on a wide screen. */
function gridFor(count: number, w: number, h: number) {
  const side = w >= h ? h / 3 : w / 2
  const capacity = Math.max(1, Math.round(w / side) * Math.round(h / side))
  const n = Math.min(count, capacity)
  const rows = Math.min(n, Math.max(1, Math.round(Math.sqrt((n * h) / w))))
  const cols = Math.ceil(n / rows)
  return { rows, cols, cells: rows * cols, capacity }
}

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(t)
      t = setTimeout(() => setSize({ w: window.innerWidth, h: window.innerHeight }), 250)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export default function DisplayPage() {
  const { photos, settings, loaded } = useWall()
  const { w, h } = useViewport()
  const [broken, setBroken] = useState<Set<string>>(new Set())
  const [tiles, setTiles] = useState<string[]>([])
  const [spot, setSpot] = useState<Photo | null>(null)

  const approved = useMemo(
    () =>
      photos
        .filter((p) => p.status === 'approved' && !broken.has(p.id))
        .sort((a, b) => (a.approved_at ?? '').localeCompare(b.approved_at ?? '')),
    [photos, broken],
  )
  const byId = useMemo(() => new Map(approved.map((p) => [p.id, p])), [approved])
  const grid = gridFor(approved.length, w, h)

  // Mutable bookkeeping the swap timer reads without re-subscribing.
  const lastShown = useRef(new Map<string, number>())
  const tileSince = useRef<number[]>([])
  const fresh = useRef<string[]>([])
  const spotQueue = useRef<string[]>([])
  const known = useRef<Set<string> | null>(null)
  const live = useRef({ approved, byId, tiles, settings, spot })
  live.current = { approved, byId, tiles, settings, spot }

  useEffect(() => {
    document.body.classList.add('display-shell')
    return () => document.body.classList.remove('display-shell')
  }, [])

  // Newly approved photos jump the queue (and get a spotlight). The first load isn't "new".
  useEffect(() => {
    if (!loaded) return
    const ids = new Set(approved.map((p) => p.id))
    if (known.current) {
      for (const p of approved) {
        if (!known.current.has(p.id)) {
          fresh.current.push(p.id)
          spotQueue.current.push(p.id)
        }
      }
    }
    known.current = ids
  }, [approved, loaded])

  function pick(exclude: Set<string>): Photo | null {
    const { approved: list, byId: map } = live.current
    while (fresh.current.length) {
      const id = fresh.current.shift()!
      const p = map.get(id)
      if (p && !exclude.has(id)) return p
    }
    const candidates = list.filter((p) => !exclude.has(p.id))
    if (!candidates.length) return null
    candidates.sort((a, b) => (lastShown.current.get(a.id) ?? 0) - (lastShown.current.get(b.id) ?? 0))
    return candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]
  }

  function show(i: number, id: string) {
    lastShown.current.set(id, Date.now())
    tileSince.current[i] = Date.now()
  }

  // (Re)assign tiles when the grid size changes or a photo on screen goes away.
  // Tiles that still hold a live photo keep it, so only the affected cells change.
  useEffect(() => {
    // The tile list follows remote data (approvals and removals arrive over realtime).
    // oxlint-disable-next-line react/set-state-in-effect
    setTiles((prev) => {
      if (prev.length === grid.cells && prev.every((id) => byId.has(id))) return prev
      const list = live.current.approved
      const next: string[] = []
      const used = new Set<string>()
      for (let i = 0; i < grid.cells; i++) {
        let id = prev[i] && byId.has(prev[i]) && !used.has(prev[i]) ? prev[i] : undefined
        if (!id) id = pick(used)?.id
        // Fewer photos than cells (only possible in the last row): repeat.
        if (!id) id = list[i % list.length]?.id
        if (!id) continue
        used.add(id)
        next.push(id)
        if (id !== prev[i]) show(i, id)
      }
      return next
    })
  }, [byId, grid.cells])

  // The swap timer: every N seconds, either spotlight a new photo or swap the stalest tile.
  useEffect(() => {
    const timer = setInterval(() => {
      const { tiles: current, settings: s, spot: spotting, byId: map } = live.current
      if (spotting || !current.length) return
      while (spotQueue.current.length) {
        const p = map.get(spotQueue.current.shift()!)
        if (p && s.spotlight) {
          startSpotlight(p)
          return
        }
      }
      const photo = pick(new Set(current))
      if (!photo) return
      swapStalest(photo)
    }, Math.max(2, settings.seconds) * 1000)
    return () => clearInterval(timer)
  }, [settings.seconds])

  function swapStalest(photo: Photo) {
    setTiles((prev) => {
      if (!prev.length || prev.includes(photo.id)) return prev
      let idx = 0
      prev.forEach((_, i) => {
        if ((tileSince.current[i] ?? 0) < (tileSince.current[idx] ?? 0)) idx = i
      })
      const next = [...prev]
      next[idx] = photo.id
      show(idx, photo.id)
      return next
    })
  }

  function startSpotlight(photo: Photo) {
    setSpot(photo)
    setTimeout(() => {
      setSpot(null)
      // After the spotlight fades, the photo takes the stalest tile.
      setTimeout(() => {
        const current = live.current.byId.get(photo.id)
        if (current) swapStalest(current)
      }, 800)
    }, SPOTLIGHT_MS)
  }

  const submitUrl = `${window.location.origin}${window.location.pathname}#/`
  const showQr = settings.show_qr

  if (!loaded) return <div className="fixed inset-0 bg-black" />

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {approved.length === 0 ? (
        <EmptyScreen submitUrl={submitUrl} showQr={showQr} />
      ) : (
        <div
          className="absolute inset-0 grid gap-1"
          style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, gridTemplateRows: `repeat(${grid.rows}, 1fr)` }}
        >
          {tiles.map((id, i) => {
            const p = byId.get(id)
            return p ? (
              <Tile
                key={i}
                photo={p}
                showCaption={settings.captions}
                onBroken={() => setBroken((b) => new Set(b).add(p.id))}
              />
            ) : (
              <div key={i} className="bg-[#05070c]" />
            )
          })}
        </div>
      )}

      <Spotlight photo={spot} />

      {showQr && approved.length > 0 && (
        <div className="absolute right-[2vmin] bottom-[2vmin] z-10 flex items-center gap-[1.5vmin] rounded-[1.2vmin] bg-black/80 p-[1.2vmin] pr-[2.4vmin]">
          <Qr text={submitUrl} className="h-[13vmin] w-[13vmin] rounded-[0.6vmin] bg-white p-[0.6vmin]" />
          <div className="font-display text-[3.4vmin] leading-[0.95] font-extrabold text-white">
            Send your
            <br />
            <span className="text-[var(--color-led)]">photo</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** One mosaic cell. Keeps the outgoing photo underneath while the incoming one fades in. */
function Tile({ photo, showCaption, onBroken }: { photo: Photo; showCaption: boolean; onBroken: () => void }) {
  const [stack, setStack] = useState<{ p: Photo; visible: boolean }[]>([{ p: photo, visible: false }])
  const [prevId, setPrevId] = useState(photo.id)
  if (photo.id !== prevId) {
    setPrevId(photo.id)
    setStack((s) => (s.some((x) => x.p.id === photo.id) ? s : [...s.slice(-1), { p: photo, visible: false }]))
  }

  function onLoad(id: string) {
    setStack((s) => s.map((x) => (x.p.id === id ? { ...x, visible: true } : x)))
    setTimeout(() => {
      setStack((s) => {
        const idx = s.findIndex((x) => x.p.id === id)
        return idx > 0 ? s.slice(idx) : s
      })
    }, 1300)
  }

  const top = stack[stack.length - 1]
  const caption = showCaption && top.visible && (top.p.caption || top.p.credit)

  return (
    <div className="relative overflow-hidden bg-[#05070c]">
      {stack.map(({ p, visible }) => (
        <img
          key={p.id}
          src={photoUrl(p.path)}
          alt={p.caption || 'Photo'}
          className={`tile-img ${visible ? 'is-visible' : ''}`}
          onLoad={() => onLoad(p.id)}
          onError={onBroken}
        />
      ))}
      <div
        className={`fade absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-[1.6vmin] pt-[2.4vmin] pb-[1.2vmin] text-[clamp(12px,1.7vmin,28px)] leading-tight text-white ${
          caption ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {top.p.caption && <b className="block truncate font-semibold">{top.p.caption}</b>}
        {top.p.credit && <small className="block truncate text-[0.82em] opacity-75">{top.p.credit}</small>}
      </div>
    </div>
  )
}

function Spotlight({ photo }: { photo: Photo | null }) {
  // Keep the last photo mounted while fading out.
  const [shown, setShown] = useState<Photo | null>(photo)
  const [ready, setReady] = useState(false)
  if (photo && photo.id !== shown?.id) {
    setReady(false)
    setShown(photo)
  }

  const on = !!photo && ready
  return (
    <div className={`fade pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/85 ${on ? 'opacity-100' : 'opacity-0'}`}>
      {shown && (
        <figure className="grid max-w-[88vw] justify-items-center gap-[2vmin]">
          <span className="font-display bg-[var(--color-led)] px-[2vmin] py-[0.4vmin] text-[clamp(16px,3vmin,48px)] font-black tracking-widest text-[var(--color-bg)]">
            Just added
          </span>
          <img
            src={photoUrl(shown.path)}
            alt={shown.caption || 'New photo'}
            onLoad={() => setReady(true)}
            className="max-h-[72vh] max-w-[88vw] border-[0.6vmin] border-white object-contain shadow-2xl"
          />
          {(shown.caption || shown.credit) && (
            <figcaption className="text-center text-[clamp(16px,3vmin,52px)] leading-tight text-balance text-white">
              {shown.caption}
              {shown.credit && <small className="mt-[0.4em] block text-[0.6em] text-[#c9cfdd]">{shown.credit}</small>}
            </figcaption>
          )}
        </figure>
      )}
    </div>
  )
}

function EmptyScreen({ submitUrl, showQr }: { submitUrl: string; showQr: boolean }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[var(--color-bg)] bg-[radial-gradient(circle,#1c2338_1.2px,transparent_1.6px)] bg-[length:14px_14px] p-6 text-center">
      <div className="grid justify-items-center gap-[3vmin]">
        <h2 className="font-display text-[clamp(36px,10vmin,160px)] leading-none font-black text-[var(--color-led)] drop-shadow-[0_0_24px_rgba(255,182,39,0.45)]">
          Your photo here
        </h2>
        {showQr ? (
          <>
            <Qr text={submitUrl} className="h-[26vmin] w-[26vmin] rounded-[1vmin] bg-white p-[1vmin]" />
            <p className="text-[clamp(16px,3vmin,40px)] text-[var(--color-text-muted)]">Scan to send a photo to the big screen</p>
          </>
        ) : (
          <p className="text-[clamp(16px,3vmin,40px)] text-[var(--color-text-muted)]">Approved photos fill this screen.</p>
        )}
      </div>
    </div>
  )
}

function Qr({ text, className }: { text: string; className?: string }) {
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(text)
    qr.make()
    return qr.createSvgTag({ margin: 0, scalable: true })
  }, [text])
  // The SVG is generated locally from our own URL, never from user input.
  return <div className={`[&>svg]:h-full [&>svg]:w-full ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: svg }} />
}
