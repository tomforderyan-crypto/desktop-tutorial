import Constants from 'expo-constants';
import type { MpClass, MpDriver, MpEvent, MpPointStandingEntry } from './types';
import {
  mockClasses,
  mockDrivers,
  mockSchedule,
  mockStandingsByClass,
  mockTrackMeta,
  TRACK_ID,
} from './mockData';

/**
 * MyRacePass API key is pending (see README). Every method below returns
 * mock data shaped like the real MRP response and is written so that
 * flipping USE_MOCK to false and filling in MYRACEPASS_API_KEY is the only
 * change needed once the key arrives.
 */
const USE_MOCK = true;
const MYRACEPASS_API_KEY = process.env.EXPO_PUBLIC_MYRACEPASS_API_KEY ?? '';
const MYRACEPASS_BASE_URL = 'https://api.myracepass.com/v2';
const trackId: number =
  Constants.expoConfig?.extra?.myRacePassTrackId ?? TRACK_ID;

async function mrpFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${MYRACEPASS_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${MYRACEPASS_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`MyRacePass request failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const myRacePass = {
  trackId,
  trackMeta: () => delay(mockTrackMeta),

  getClasses(): Promise<MpClass[]> {
    if (USE_MOCK) return delay(mockClasses);
    return mrpFetch<MpClass[]>(`/tracks/${trackId}/classes`);
  },

  getPointStandings(classId?: number): Promise<MpPointStandingEntry[]> {
    if (USE_MOCK) {
      const all = Object.values(mockStandingsByClass).flat();
      return delay(classId ? all.filter((e) => e.classId === classId) : all);
    }
    const suffix = classId ? `?classId=${classId}` : '';
    return mrpFetch<MpPointStandingEntry[]>(`/tracks/${trackId}/pointStandings${suffix}`);
  },

  getDrivers(classId?: number): Promise<MpDriver[]> {
    if (USE_MOCK) {
      return delay(classId ? mockDrivers.filter((d) => d.classId === classId) : mockDrivers);
    }
    const suffix = classId ? `?classId=${classId}` : '';
    return mrpFetch<MpDriver[]>(`/tracks/${trackId}/drivers${suffix}`);
  },

  getDriver(driverId: number): Promise<MpDriver | undefined> {
    if (USE_MOCK) return delay(mockDrivers.find((d) => d.driverId === driverId));
    return mrpFetch<MpDriver>(`/tracks/${trackId}/drivers/${driverId}`);
  },

  getSchedule(): Promise<MpEvent[]> {
    if (USE_MOCK) return delay(mockSchedule);
    return mrpFetch<MpEvent[]>(`/tracks/${trackId}/events`);
  },
};
