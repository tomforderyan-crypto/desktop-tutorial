import { Router } from 'express';
import { readJson, writeJson } from '../jsonStore';
import { requireAdminKey } from '../adminAuth';
import type { BannerAd, FoodVendor, SocialAccount } from '../types';

import seedBannerAds from '../../data/bannerAds.seed.json';
import seedFoodVendors from '../../data/foodVendors.seed.json';
import seedSocialAccounts from '../../data/socialAccounts.seed.json';

export const contentRouter = Router();

/**
 * Each resource is GET (public, read by the app) + PUT (admin-key
 * protected, replaces the whole list). A whole-list replace is the
 * simplest possible "edit this in one place" contract for the small set of
 * items each of these is — staff re-send the full array to change it.
 */
function registerResource<T>(path: string, storeName: string, seed: T[]) {
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

registerResource<BannerAd>('banner-ads', 'bannerAds', seedBannerAds as BannerAd[]);
registerResource<FoodVendor>('food-vendors', 'foodVendors', seedFoodVendors as FoodVendor[]);
registerResource<SocialAccount>('social-accounts', 'socialAccounts', seedSocialAccounts as SocialAccount[]);
