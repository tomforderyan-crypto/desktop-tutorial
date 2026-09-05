import { cms, type SocialAccount } from './cms';

export interface SocialPost {
  id: string;
  accountId: string;
  platform: SocialAccount['platform'];
  author: string;
  caption: string;
  imageUrl?: string;
  postedIso: string;
  permalink?: string;
}

const USE_MOCK = true;

function mockPostsFor(account: SocialAccount, count: number): SocialPost[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${account.id}-post-${i}`,
    accountId: account.id,
    platform: account.platform,
    author: account.displayName,
    caption:
      i === 0
        ? 'Gates open at 5pm this Friday — see you at the track! 🏁'
        : `Recap from a recent race night at ${account.displayName}.`,
    imageUrl: `https://placehold.co/500x500/16181d/f5f5f5?text=${account.platform}`,
    postedIso: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(),
  }));
}

/**
 * Real integration point: Meta's Graph API for Facebook Page posts and
 * Instagram Business accounts (requires a connected Facebook App + a
 * long-lived Page access token, refreshed server-side — never store that
 * token in the mobile app). Swap USE_MOCK off once that token proxy exists
 * behind the CMS backend.
 */
export async function getSocialFeed(): Promise<SocialPost[]> {
  const accounts = await cms.getSocialAccounts();
  if (USE_MOCK) {
    return accounts
      .flatMap((account) => mockPostsFor(account, 4))
      .sort((a, b) => (a.postedIso < b.postedIso ? 1 : -1));
  }
  // TODO: fetch from CMS_BASE_URL + '/social-feed' once the backend proxy
  // to Meta's Graph API exists.
  return [];
}
