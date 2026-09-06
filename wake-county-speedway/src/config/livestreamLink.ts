import type { LivestreamLink } from '../api/cms';

/**
 * Fallback livestream link used until the CMS backend is live. The stream
 * itself is hosted entirely outside this app (whatever the production
 * partner already broadcasts to) — this is just the link plus a live/offline
 * flag staff flip when a race night starts, editable here or via the CMS
 * backend's PUT /livestream-link.
 */
export const localLivestreamLink: LivestreamLink = {
  url: 'https://www.youtube.com/@WakeCountySpeedway/live',
  label: 'Friday Night Racing',
  isLive: false,
};
