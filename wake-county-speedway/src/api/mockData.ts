import type {
  MpClass,
  MpDriver,
  MpEvent,
  MpPointStandingEntry,
  MpTrackMeta,
} from './types';

export const TRACK_ID = 2800;

export const mockTrackMeta: MpTrackMeta = {
  trackId: TRACK_ID,
  trackName: 'Wake County Speedway',
  location: 'Raleigh, NC',
  timezone: 'America/New_York',
};

// Seven car classes, matching the existing points-standings spreadsheet feed.
export const mockClasses: MpClass[] = [
  { classId: 1, trackId: TRACK_ID, className: 'Late Model Stock', sortOrder: 1 },
  { classId: 2, trackId: TRACK_ID, className: 'Limited Late Model', sortOrder: 2 },
  { classId: 3, trackId: TRACK_ID, className: 'Street Stock', sortOrder: 3 },
  { classId: 4, trackId: TRACK_ID, className: 'U-Car', sortOrder: 4 },
  { classId: 5, trackId: TRACK_ID, className: 'Mini Stock', sortOrder: 5 },
  { classId: 6, trackId: TRACK_ID, className: 'Bandolero', sortOrder: 6 },
  { classId: 7, trackId: TRACK_ID, className: 'Legend Car', sortOrder: 7 },
];

const driverSeed: Array<[number, string, string, string, number, string]> = [
  [101, 'Cole', 'Hensley', '18', 1, 'Garner, NC'],
  [102, 'Marcus', 'Vance', '07', 1, 'Wendell, NC'],
  [103, 'Trey', 'Whitfield', '92', 1, 'Fuquay-Varina, NC'],
  [104, 'Dylan', 'Ferris', '3X', 2, 'Clayton, NC'],
  [105, 'Ashley', 'Norwood', '21', 2, 'Zebulon, NC'],
  [106, 'Ronnie', 'Baucom', '55', 3, 'Knightdale, NC'],
  [107, 'JT', 'Averette', '14', 3, 'Wake Forest, NC'],
  [108, 'Casey', 'Lund', '8', 4, 'Garner, NC'],
  [109, 'Bree', 'Simmons', '2J', 5, 'Rolesville, NC'],
  [110, 'Owen', 'Pruitt', '45', 6, 'Raleigh, NC'],
  [111, 'Nora', 'Kimbrell', '9', 6, 'Apex, NC'],
  [112, 'Levi', 'Chastain', '17', 7, 'Holly Springs, NC'],
];

export const mockDrivers: MpDriver[] = driverSeed.map(
  ([driverId, firstName, lastName, carNumber, classId, hometown]) => {
    const cls = mockClasses.find((c) => c.classId === classId)!;
    return {
      driverId,
      firstName,
      lastName,
      carNumber,
      classId,
      className: cls.className,
      hometown,
      photoUrl: `https://placehold.co/200x200/16181d/f5f5f5?text=${carNumber}`,
      carPhotoUrl: `https://placehold.co/400x260/16181d/f5f5f5?text=Car+${carNumber}`,
      sponsors: [],
      bio: `${firstName} ${lastName} races the No. ${carNumber} in ${cls.className} at Wake County Speedway.`,
    };
  }
);

function buildStandings(classId: number): MpPointStandingEntry[] {
  const drivers = mockDrivers.filter((d) => d.classId === classId);
  const leaderPoints = 620;
  return drivers
    .map((d, idx) => {
      const points = leaderPoints - idx * 37 - (idx === 0 ? 0 : idx * 4);
      return {
        position: idx + 1,
        driverId: d.driverId,
        driverName: `${d.firstName} ${d.lastName}`,
        carNumber: d.carNumber,
        photoUrl: d.photoUrl,
        classId: d.classId,
        className: d.className,
        points,
        starts: 14 - idx,
        wins: Math.max(0, 3 - idx),
        top5: Math.max(0, 10 - idx * 2),
        top10: Math.max(0, 13 - idx),
        behindLeader: idx === 0 ? 0 : leaderPoints - points,
      };
    })
    .sort((a, b) => b.points - a.points)
    .map((entry, idx) => ({ ...entry, position: idx + 1 }));
}

export const mockStandingsByClass: Record<number, MpPointStandingEntry[]> =
  Object.fromEntries(mockClasses.map((c) => [c.classId, buildStandings(c.classId)]));

function nextFridays(count: number): Date[] {
  const dates: Date[] = [];
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  for (let i = 0; i < count; i++) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return dates;
}

export const mockSchedule: MpEvent[] = nextFridays(8).map((date, idx) => ({
  eventId: 5000 + idx,
  trackId: TRACK_ID,
  eventName: idx === 3 ? 'Wake County 100 - Championship Night' : 'Weekly Racing Program',
  eventDateIso: date.toISOString(),
  gatesOpen: '17:00',
  practiceTime: '17:30',
  raceTime: '19:00',
  classIds: mockClasses.map((c) => c.classId),
  status: 'scheduled',
  recurrence: { frequency: 'weekly', dayOfWeek: 5 },
  ticketPriceInfoUrl: undefined,
}));
