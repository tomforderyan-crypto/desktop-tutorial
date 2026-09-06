import { Router } from 'express';
import { readJson, writeJson } from '../jsonStore';
import { requireAdminKey } from '../adminAuth';
import type { BannerAd, FoodVendor, LivestreamLink, SocialAccount } from '../types';

import seedBannerAds from '../../data/bannerAds.seed.json';
import seedFoodVendors from '../../data/foodVendors.seed.json';
import seedSocialAccounts from '../../data/socialAccounts.seed.json';
import seedLivestreamLink from '../../data/livestreamLink.seed.json';

export const contentRouter = Router();

/**
 * Each list resource is GET (public, read by the app) + PUT (admin-key
 * protected, replaces the whole list). A whole-list replace is the
 * simplest possible "edit this in one place" contract for the small set of
 * items each of these is — staff re-send the full array to change it.
 */
function registerListResource<T>(path: string, storeName: string, seed: T[]) {
  contentRouter.get(`/${path}`, async (_req, res) => {
    res.json(await readJson<T[]>(storeName, seed));
  });

  contentRouter.put(`/${path}`, requireAdminKey, async (req, res) => {
    if (!Array.isArray(req.body)) {
      res.status(400).json({ error: `Expected a JSON array of ${path}.` });
      return;
    }
    await writeJson(storeName, req.body);
    res.json(req.body);
  });
}

/** Same GET/PUT contract as above, but for a single object instead of a list. */
function registerObjectResource<T extends object>(path: string, storeName: string, seed: T) {
  contentRouter.get(`/${path}`, async (_req, res) => {
    res.json(await readJson<T>(storeName, seed));
  });

  contentRouter.put(`/${path}`, requireAdminKey, async (req, res) => {
    if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
      res.status(400).json({ error: `Expected a JSON object for ${path}.` });
      return;
    }
    await writeJson(storeName, req.body);
    res.json(req.body);
  });
}

registerListResource<BannerAd>('banner-ads', 'bannerAds', seedBannerAds as BannerAd[]);
registerListResource<FoodVendor>('food-vendors', 'foodVendors', seedFoodVendors as FoodVendor[]);
registerListResource<SocialAccount>('social-accounts', 'socialAccounts', seedSocialAccounts as SocialAccount[]);

/**
 * The livestream is hosted entirely outside this app (YouTube Live,
 * Facebook Live, whatever the production partner already runs) — the app
 * just needs a link plus a live/offline flag staff can flip. No Mux, no
 * video infrastructure of our own.
 */
registerObjectResource<LivestreamLink>('livestream-link', 'livestreamLink', seedLivestreamLink as LivestreamLink);
