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
}

export interface Forecast {
  hourly: Hourly
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
    'temperature_2m,apparent_temperature,precipitation_probability,precipitation',
  )
  url.searchParams.set('forecast_days', '7')
  url.searchParams.set('timezone', 'auto')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`)
  return (await res.json()) as Forecast
}
