/**
 * Lightweight backend/CMS for content that changes more often than an App
 * Store review cycle allows: banner ads, food vendors, and which social
 * accounts get pulled into the feed. Point CMS_BASE_URL at any JSON-serving
 * backend (a small hosted API, a headless CMS, or even a static JSON file
 * behind a CDN) — the app only needs these shapes back. Falls back to local
 * config in src/config/ when the backend isn't reachable or isn't set up
 * yet, so the app is never blocked on the backend existing.
 */
import { localBannerAds } from '../config/bannerAds';
import { localFoodVendors } from '../config/foodVendors';
import { localSocialAccounts } from '../config/socialAccounts';

export const CMS_BASE_URL = process.env.EXPO_PUBLIC_CMS_BASE_URL ?? '';

export interface BannerAd {
  id: string;
  imageUrl: string;
  headline: string;
  linkUrl?: string;
  startsIso?: string;
  endsIso?: string;
}

export interface FoodVendor {
  id: string;
  name: string;
  description: string;
  menuUrl?: string;
  photoUrl?: string;
}

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram';
  handle: string;
  displayName: string;
}

async function fetchJsonOrFallback<T>(path: string, fallback: T): Promise<T> {
  if (!CMS_BASE_URL) return fallback;
  try {
    const res = await fetch(`${CMS_BASE_URL}${path}`);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export const cms = {
  getBannerAds: () => fetchJsonOrFallback<BannerAd[]>('/banner-ads', localBannerAds),
  getFoodVendors: () => fetchJsonOrFallback<FoodVendor[]>('/food-vendors', localFoodVendors),
  getSocialAccounts: () =>
    fetchJsonOrFallback<SocialAccount[]>('/social-accounts', localSocialAccounts),
};
