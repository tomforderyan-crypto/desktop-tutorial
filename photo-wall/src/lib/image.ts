const MAX_EDGE = 2048
const PASS_THROUGH = ['image/jpeg', 'image/png', 'image/webp']

export const MAX_FILES = 10

export function isPhoto(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)
}

/**
 * Downscale a phone photo to a sensible size for a big screen and bake in its
 * EXIF rotation. GIFs pass through untouched so they keep their animation.
 */
export async function prepareImage(file: File): Promise<{ blob: Blob; type: string; ext: string }> {
  if (file.type === 'image/gif') return { blob: file, type: 'image/gif', ext: 'gif' }
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height))
    const w = Math.max(1, Math.round(bmp.width * scale))
    const h = Math.max(1, Math.round(bmp.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
    bmp.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
    if (blob) return { blob, type: 'image/jpeg', ext: 'jpg' }
  } catch {
    // Fall through: the browser couldn't decode it (e.g. HEIC on desktop Chrome).
  }
  if (PASS_THROUGH.includes(file.type)) return { blob: file, type: file.type, ext: file.type.split('/')[1] }
  throw new Error(`Couldn't read ${file.name}. Try saving it as a JPEG or PNG.`)
}
