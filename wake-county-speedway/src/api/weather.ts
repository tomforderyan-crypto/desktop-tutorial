/**
 * Race-day weather. Shape mirrors OpenWeatherMap's "One Call" current +
 * daily response, trimmed to the fields the widget needs. No manual admin
 * input required — swap USE_MOCK off and set EXPO_PUBLIC_OPENWEATHER_API_KEY
 * once a key is provisioned.
 */
export interface WeatherSnapshot {
  tempF: number;
  condition: string;
  icon: string;
  precipChancePct: number;
  windMph: number;
  asOfIso: string;
}

const USE_MOCK = true;
const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ?? '';
// Wake County Speedway approximate coordinates (Raleigh, NC area).
const LAT = 35.77;
const LON = -78.63;

export async function getRaceDayWeather(): Promise<WeatherSnapshot> {
  if (USE_MOCK || !OPENWEATHER_API_KEY) {
    return {
      tempF: 74,
      condition: 'Partly Cloudy',
      icon: 'partly-cloudy',
      precipChancePct: 10,
      windMph: 6,
      asOfIso: new Date().toISOString(),
    };
  }

  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&units=imperial&exclude=minutely,alerts&appid=${OPENWEATHER_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
  const json = await res.json();
  return {
    tempF: Math.round(json.current.temp),
    condition: json.current.weather?.[0]?.main ?? 'Unknown',
    icon: json.current.weather?.[0]?.icon ?? '',
    precipChancePct: Math.round((json.daily?.[0]?.pop ?? 0) * 100),
    windMph: Math.round(json.current.wind_speed),
    asOfIso: new Date().toISOString(),
  };
}
