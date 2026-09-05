/**
 * Mux powers the livestream. IMPORTANT: Mux's Data API secret token must
 * never ship inside the mobile app — it grants account-wide read/write
 * access. Live/offline status is instead fetched from our own lightweight
 * backend (`CMS_BASE_URL`, see cms.ts), which holds the Mux secret and
 * proxies a single "is this asset live" boolean + the public playback ID.
 * The playback ID itself is safe to embed/fetch client-side; Mux playback
 * IDs are designed to be public for a public stream.
 */
import { CMS_BASE_URL } from './cms';

export interface LiveStreamStatus {
  isLive: boolean;
  playbackId: string | null;
  streamTitle: string;
  hlsUrl: string | null;
}

const USE_MOCK = true;

// Swap for the real public playback ID once the production partner's Mux
// live stream is provisioned and wired to our backend.
const MOCK_PLAYBACK_ID = 'DEMO00PlaybackIdPending';

export async function getLiveStreamStatus(): Promise<LiveStreamStatus> {
  if (USE_MOCK) {
    return {
      isLive: false,
      playbackId: MOCK_PLAYBACK_ID,
      streamTitle: 'Friday Night Racing - Wake County Speedway',
      hlsUrl: null,
    };
  }

  const res = await fetch(`${CMS_BASE_URL}/livestream/status`);
  if (!res.ok) throw new Error(`Livestream status request failed: ${res.status}`);
  const json = await res.json();
  return {
    isLive: Boolean(json.isLive),
    playbackId: json.playbackId ?? null,
    streamTitle: json.streamTitle ?? 'Wake County Speedway Live',
    hlsUrl: json.playbackId ? `https://stream.mux.com/${json.playbackId}.m3u8` : null,
  };
}
