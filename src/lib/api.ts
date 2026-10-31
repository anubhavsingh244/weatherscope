export interface Place {
  id: number
  name: string
  country?: string
  admin1?: string
  latitude: number
  longitude: number
  timezone: string
}

export interface Hourly {
  time: string[] // local ISO, e.g. 2026-10-31T14:00
  temperature_2m: number[]
  apparent_temperature: number[]
  precipitation_probability: number[]
  precipitation: number[]
  wind_speed_10m: number[] // km/h
  wind_direction_10m: number[] // degrees
}

export interface Daily {
  time: string[] // YYYY-MM-DD
  temperature_2m_max: number[]
  temperature_2m_min: number[]
  uv_index_max: number[]
  sunrise: string[] // local ISO
  sunset: string[]
}

export interface Forecast {
  hourly: Hourly
  daily: Daily
  utc_offset_seconds?: number
  /** ms since epoch when this response was fetched (set client-side) */
  fetchedAt: number
}

export interface History {
  daily: { time: string[]; temperature_2m_mean: (number | null)[] }
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '6')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const data = (await res.json()) as { results?: Place[] }
  return data.results ?? []
}

export async function fetchForecast(p: Pick<Place, 'latitude' | 'longitude'>): Promise<Forecast> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(p.latitude))
  url.searchParams.set('longitude', String(p.longitude))
  url.searchParams.set(
    'hourly',
    'temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_direction_10m',
  )
  url.searchParams.set(
    'daily',
    'temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset',
  )
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone', 'auto')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`)
  const data = (await res.json()) as Omit<Forecast, 'fetchedAt'>
  return { ...data, fetchedAt: Date.now() }
}

const iso = (d: Date) => d.toISOString().slice(0, 10)

/** Daily mean temperature from 2015 up to a few days ago (the archive lags behind real time). */
export async function fetchHistory(
  p: Pick<Place, 'latitude' | 'longitude'>,
  now: Date = new Date(),
): Promise<History> {
  const end = new Date(now.getTime() - 5 * 86_400_000)
  const url = new URL('https://archive-api.open-meteo.com/v1/archive')
  url.searchParams.set('latitude', String(p.latitude))
  url.searchParams.set('longitude', String(p.longitude))
  url.searchParams.set('start_date', '2015-01-01')
  url.searchParams.set('end_date', iso(end))
  url.searchParams.set('daily', 'temperature_2m_mean')
  url.searchParams.set('timezone', 'auto')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`History failed (${res.status})`)
  return (await res.json()) as History
}
