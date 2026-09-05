import type { BannerAd } from '../api/cms';

/**
 * Fallback banner ads used until the CMS backend is live. Edit this array
 * (or, once EXPO_PUBLIC_CMS_BASE_URL is set, the backend's /banner-ads
 * endpoint) to promote events without an app resubmission.
 */
export const localBannerAds: BannerAd[] = [
  {
    id: 'ad-championship-night',
    imageUrl: 'https://placehold.co/800x300/c8102e/f5f5f5?text=Championship+Night',
    headline: 'Championship Night — Get Your Tickets',
    linkUrl: undefined,
  },
  {
    id: 'ad-season-pass',
    imageUrl: 'https://placehold.co/800x300/16181d/f2b705?text=2026+Season+Passes',
    headline: '2026 Season Passes Now Available',
    linkUrl: undefined,
  },
];
