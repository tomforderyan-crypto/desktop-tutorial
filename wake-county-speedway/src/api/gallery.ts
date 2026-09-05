export interface GalleryMediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl: string;
}

export interface GalleryEvent {
  eventId: number;
  eventName: string;
  dateIso: string;
  items: GalleryMediaItem[];
}

const USE_MOCK = true;

const mockEvents: GalleryEvent[] = [
  {
    eventId: 4990,
    eventName: 'Season Opener',
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    items: Array.from({ length: 6 }, (_, i) => ({
      id: `4990-${i}`,
      type: i === 5 ? 'video' : 'photo',
      url: `https://placehold.co/900x600/16181d/f5f5f5?text=Season+Opener+${i + 1}`,
      thumbnailUrl: `https://placehold.co/300x200/16181d/f5f5f5?text=Season+Opener+${i + 1}`,
    })),
  },
  {
    eventId: 4991,
    eventName: 'Fan Appreciation Night',
    dateIso: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    items: Array.from({ length: 4 }, (_, i) => ({
      id: `4991-${i}`,
      type: 'photo',
      url: `https://placehold.co/900x600/16181d/f5f5f5?text=Fan+Night+${i + 1}`,
      thumbnailUrl: `https://placehold.co/300x200/16181d/f5f5f5?text=Fan+Night+${i + 1}`,
    })),
  },
];

/**
 * Real integration point: a media backend (S3/Cloudflare Images bucket
 * indexed by event, or a headless CMS gallery model) behind CMS_BASE_URL.
 */
export async function getGalleryEvents(): Promise<GalleryEvent[]> {
  if (USE_MOCK) return mockEvents;
  return [];
}
