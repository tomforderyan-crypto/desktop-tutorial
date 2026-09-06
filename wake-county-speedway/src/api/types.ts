/**
 * Shapes mirror MyRacePass's public v2 track feeds (tracks/{id}/classes,
 * /pointStandings, /events, /drivers) as documented for other MRP tracks.
 * Field names are our best-effort match without the real API key — verify
 * against the live response once MyRacePass approves the key for track 2800
 * and adjust here; every screen reads through these types, not raw JSON.
 */

export interface MpClass {
  classId: number;
  trackId: number;
  className: string;
  sortOrder: number;
}

export interface MpDriver {
  driverId: number;
  firstName: string;
  lastName: string;
  carNumber: string;
  classId: number;
  className: string;
  hometown?: string;
  photoUrl?: string;
  carPhotoUrl?: string;
  sponsors?: string[];
  bio?: string;
}

export interface MpPointStandingEntry {
  position: number;
  driverId: number;
  driverName: string;
  carNumber: string;
  photoUrl?: string;
  classId: number;
  className: string;
  points: number;
  starts: number;
  wins: number;
  top5: number;
  top10: number;
  behindLeader: number;
}

export interface MpRaceResultEntry {
  position: number;
  driverId: number;
  driverName: string;
  carNumber: string;
  classId: number;
  className: string;
  laps: number;
  status: 'Running' | 'DNF' | 'DQ';
}

export interface MpEvent {
  eventId: number;
  trackId: number;
  eventName: string;
  eventDateIso: string;
  gatesOpen?: string;
  practiceTime?: string;
  raceTime?: string;
  classIds: number[];
  status: 'scheduled' | 'rained-out' | 'postponed' | 'completed' | 'cancelled';
  recurrence?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek: number; // 0 = Sunday
  };
  ticketPriceInfoUrl?: string;
  results?: MpRaceResultEntry[];
}

export interface MpTrackMeta {
  trackId: number;
  trackName: string;
  location: string;
  timezone: string;
}
