import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchForecast, fetchHistory, searchPlaces, type Place } from './lib/api'
import {
  climateComparison, lastDays, precipitationGrid, rangeBars, sunArc, temperatureGrid, windRose,
} from './lib/transform'
import { Chart } from './components/Chart'
import {
  calendarOption, climateOption, heatmapOption, hourlyOption, rangeBarsOption, sunArcOption, uvOption,
  windRoseOption,
} from './components/charts'

const DEFAULT_PLACE: Place = {
  id: 2950159, name: 'Berlin', country: 'Germany', latitude: 52.52, longitude: 13.41, timezone: 'Europe/Berlin',
}

/** The selected location lives in the URL (?lat=&lon=&name=) so views are shareable. */
function placeFromUrl(): Place {
  const q = new URLSearchParams(window.location.search)
  const lat = Number(q.get('lat'))
  const lon = Number(q.get('lon'))
  if (q.has('lat') && q.has('lon') && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    return { id: 0, name: q.get('name') ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`, latitude: lat, longitude: lon, timezone: 'auto' }
  }
  return DEFAULT_PLACE
}

function writeUrl(p: Place) {
  const q = new URLSearchParams({ lat: String(p.latitude), lon: String(p.longitude), name: p.name })
  window.history.replaceState(null, '', `?${q}`)
}

function Card({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {note && <p className="sub">{note}</p>}
      {children}
    </section>
  )
}

export default function App() {
  const [place, setPlace] = useState<Place>(placeFromUrl)
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const results = useQuery({
    queryKey: ['places', submitted],
    queryFn: () => searchPlaces(submitted),
    enabled: submitted.length > 1,
  })
  const forecast = useQuery({
    queryKey: ['forecast', place.latitude, place.longitude],
    queryFn: () => fetchForecast(place),
    staleTime: 10 * 60 * 1000,
  })
  const history = useQuery({
    queryKey: ['history', place.latitude, place.longitude],
    queryFn: () => fetchHistory(place),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const f = forecast.data
  const fc = useMemo(() => {
    if (!f) return null
    const { hourly: h, daily: d } = f
    const nowHour = f.utc_offset_seconds == null ? null : (((f.fetchedAt / 1000 + f.utc_offset_seconds) % 86400) / 3600)
    return {
      hourly: hourlyOption(h),
      temp: heatmapOption(temperatureGrid(h), {
        name: 'Temp', unit: '°C', min: -5, max: 35,
        colors: ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c'],
      }),
      rain: heatmapOption(precipitationGrid(h), {
        name: 'Rain chance', unit: '%', min: 0, max: 100,
        colors: ['#f7fbff', '#9ecae1', '#2171b5', '#08306b'],
      }),
      wind: windRoseOption(windRose(h.wind_speed_10m, h.wind_direction_10m)),
      range: rangeBarsOption(rangeBars(d)),
      uv: uvOption(d.time, d.uv_index_max),
      sun: d.sunrise[0] && d.sunset[0] ? sunArc(d.sunrise[0], d.sunset[0]) : null,
      nowHour,
    }
  }, [f])

  const hist = useMemo(() => {
    const hd = history.data?.daily
    if (!hd) return null
    const days = lastDays(hd.time, hd.temperature_2m_mean)
    if (days.length === 0) return null
    return { calendar: calendarOption(days), climate: climateOption(climateComparison(hd.time, hd.temperature_2m_mean)) }
  }, [history.data])

  const choose = (p: Place) => {
    setPlace(p)
    writeUrl(p)
    setSubmitted('')
    setQuery('')
  }

  return (
    <main>
      <h1>WeatherScope</h1>
      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(query.trim()) }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a city" aria-label="Search a city" />
        <button type="submit">Search</button>
      </form>
      {results.isError && <p role="alert">{(results.error as Error).message}</p>}
      {results.data && (
        <ul className="results">
          {results.data.length === 0 && <li>No matches.</li>}
          {results.data.map((p) => (
            <li key={p.id}>
              <button onClick={() => choose(p)}>
                {p.name}{p.admin1 ? `, ${p.admin1}` : ''}{p.country ? `, ${p.country}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>{place.name}</h2>
      {forecast.isLoading && <p>Loading forecast…</p>}
      {forecast.isError && <p role="alert">{(forecast.error as Error).message}</p>}
      {fc && (
        <div className="grid">
          <Card title="7-day temperature range">
            <Chart option={fc.range} height={260} label="7-day temperature range" />
          </Card>
          <Card title="Wind rose" note="Share of the next 7 days' hours by direction the wind blows from">
            <Chart option={fc.wind} height={260} label="Wind rose" />
          </Card>
          <Card
            title="Daylight today"
            note={fc.sun ? `Sunrise ${fc.sun.sunrise} · Sunset ${fc.sun.sunset} · ${fc.sun.daylightHours} h of daylight` : undefined}
          >
            {fc.sun ? <Chart option={sunArcOption(fc.sun, fc.nowHour)} height={220} label="Daylight arc" /> : <p>No sun data.</p>}
          </Card>
          <Card title="Daily max UV index">
            <Chart option={fc.uv} height={220} label="Max UV index" />
          </Card>
        </div>
      )}
      {fc && (
        <>
          <Card title="Hourly temperature & precipitation">
            <Chart option={fc.hourly} label="Hourly temperature and precipitation" />
          </Card>
          <div className="grid" style={{ marginTop: 16 }}>
            <Card title="Temperature (hour × day)">
              <Chart option={fc.temp} height={300} label="Temperature heatmap" />
            </Card>
            <Card title="Rain probability (hour × day)">
              <Chart option={fc.rain} height={300} label="Rain probability heatmap" />
            </Card>
          </div>
        </>
      )}

      <h2>History</h2>
      {history.isLoading && <p>Loading history…</p>}
      {history.isError && <p role="alert">{(history.error as Error).message}</p>}
      {hist && (
        <>
          <Card title="Daily mean temperature, last 12 months" note="Calendar heatmap from the Open-Meteo archive (ERA5 reanalysis)">
            <Chart option={hist.calendar} height={230} label="Calendar heatmap of daily mean temperature" />
          </Card>
          <div style={{ marginTop: 16 }}>
            <Card title="Climate comparison" note="Monthly mean, last 12 months vs. average of earlier years since 2015">
              <Chart option={hist.climate} label="Climate comparison by month" />
            </Card>
          </div>
        </>
      )}

      <footer style={{ marginTop: 24 }}>
        <small>Weather data by <a href="https://open-meteo.com">Open-Meteo</a> (CC BY 4.0)</small>
      </footer>
    </main>
  )
}
