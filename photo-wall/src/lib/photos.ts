import { useEffect, useState } from 'react'
import { BUCKET, supabase } from './supabase'
import { prepareImage } from './image'

export interface Photo {
  id: string
  path: string
  caption: string
  credit: string
  status: 'pending' | 'approved'
  created_at: string
  approved_at: string | null
}

export interface WallSettings {
  seconds: number
  captions: boolean
  spotlight: boolean
  show_qr: boolean
}

export const DEFAULT_SETTINGS: WallSettings = { seconds: 5, captions: true, spotlight: true, show_qr: true }

export function photoUrl(path: string) {
  return supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : ''
}

/** Upload one photo and queue it for approval. Never returns the row: senders can't read pending photos. */
export async function sendPhoto(file: File, caption: string, credit: string) {
  if (!supabase) throw new Error('The photo wall isn’t connected yet.')
  const { blob, type, ext } = await prepareImage(file)
  const path = `uploads/${crypto.randomUUID()}.${ext}`
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: type, upsert: false })
  if (up.error) {
    throw new Error(/size/i.test(up.error.message) ? `${file.name} is too large.` : `Couldn't upload ${file.name}. Try again.`)
  }
  const ins = await supabase.from('photos').insert({ path, caption, credit })
  if (ins.error) throw new Error(`Couldn't send ${file.name}. Try again.`)
}

export async function approvePhoto(id: string) {
  const { error } = await supabase!.from('photos').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

/** Rejecting and removing are the same thing: the row and its file are deleted. */
export async function deletePhoto(photo: Photo) {
  const { error } = await supabase!.from('photos').delete().eq('id', photo.id)
  if (error) throw error
  await supabase!.storage.from(BUCKET).remove([photo.path])
}

export async function saveSettings(settings: WallSettings) {
  const { error } = await supabase!.from('wall_settings').update(settings).eq('id', 1)
  if (error) throw error
}

/**
 * Live view of the photos this visitor may see (approved ones for everyone;
 * pending ones too for a signed-in wall admin) plus the display settings.
 * Realtime events trigger a refetch; a slow poll covers dropped connections,
 * which matters on a display that runs unattended all game.
 */
export function useWall(refreshKey: unknown = null) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [settings, setSettings] = useState<WallSettings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    const db = supabase
    let cancelled = false
    let pending: ReturnType<typeof setTimeout> | undefined

    async function load() {
      const [p, s] = await Promise.all([
        db.from('photos').select('*').order('created_at', { ascending: true }),
        db.from('wall_settings').select('seconds, captions, spotlight, show_qr').eq('id', 1).maybeSingle(),
      ])
      if (cancelled) return
      if (p.error) {
        setError('Can’t reach the photo wall. Check the setup steps in the README.')
      } else {
        setError(null)
        setPhotos(p.data as Photo[])
      }
      if (s.data) setSettings({ ...DEFAULT_SETTINGS, ...(s.data as WallSettings) })
      setLoaded(true)
    }
    const refetch = () => {
      clearTimeout(pending)
      pending = setTimeout(load, 300)
    }

    load()
    const channel = db
      .channel(`wall-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wall_settings' }, refetch)
      .subscribe()
    const poll = setInterval(load, 30_000)

    return () => {
      cancelled = true
      clearTimeout(pending)
      clearInterval(poll)
      db.removeChannel(channel)
    }
  }, [refreshKey])

  return { photos, settings, setSettings, loaded, error }
}
