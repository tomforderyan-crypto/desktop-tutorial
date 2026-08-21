import { useEffect } from 'react'

/** Paints the opaque studio background on the home/control pages; overlay routes stay transparent for OBS. */
export function useBodyShell() {
  useEffect(() => {
    document.body.classList.add('studio-shell')
    return () => document.body.classList.remove('studio-shell')
  }, [])
}
