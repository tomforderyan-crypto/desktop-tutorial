import type { SocialAccount } from '../api/cms';

/**
 * Which social accounts feed the in-app Social tab. Add or remove an
 * account here (or via the CMS backend) — no other code changes needed,
 * the feed screen re-reads this list on every load.
 */
export const localSocialAccounts: SocialAccount[] = [
  {
    id: 'wcs-facebook',
    platform: 'facebook',
    handle: 'WakeCountySpeedway',
    displayName: 'Wake County Speedway',
  },
  {
    id: 'wcs-instagram',
    platform: 'instagram',
    handle: 'wakecountyspeedway',
    displayName: 'Wake County Speedway',
  },
];
