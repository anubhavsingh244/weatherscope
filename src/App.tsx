import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchForecast, searchPlaces, type Place } from './lib/api'
import { precipitationGrid, temperatureGrid } from './lib/transform'
import { Chart } from './components/Chart'
import { heatmapOption, hourlyOption } from './components/charts'

const DEFAULT_PLACE: Place = {
  id: 2950159,
  name: 'Berlin',
  country: 'Germany',
  latitude: 52.52,
  longitude: 13.41,
  timezone: 'Europe/Berlin',
}

export default function App() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE)
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

  const h = forecast.data?.hourly
  const options = useMemo(
    () =>
      h && {
        hourly: hourlyOption(h),
        temp: heatmapOption(temperatureGrid(h), {
          name: 'Temp', unit: '°C', min: -5, max: 35,
          colors: ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c'],
        }),
        rain: heatmapOption(precipitationGrid(h), {
          name: 'Rain chance', unit: '%', min: 0, max: 100,
          colors: ['#f7fbff', '#9ecae1', '#2171b5', '#08306b'],
        }),
      },
    [h],
  )

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>WeatherScope</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitted(query.trim())
        }}
      >
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a city" aria-label="Search a city" />
        <button type="submit">Search</button>
      </form>
      {results.data && (
        <ul>
          {results.data.map((p) => (
            <li key={p.id}>
              <button onClick={() => { setPlace(p); setSubmitted(''); setQuery('') }}>
                {p.name}{p.admin1 ? `, ${p.admin1}` : ''}{p.country ? `, ${p.country}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2>{place.name}</h2>
      {forecast.isLoading && <p>Loading…</p>}
      {forecast.error && <p role="alert">{(forecast.error as Error).message}</p>}
      {options && (
        <>
          <h3>Hourly temperature &amp; precipitation</h3>
          <Chart option={options.hourly} />
          <h3>Temperature heatmap (hour × day)</h3>
          <Chart option={options.temp} height={300} />
          <h3>Rain probability heatmap (hour × day)</h3>
          <Chart option={options.rain} height={300} />
        </>
      )}
      <footer><small>Data by <a href="https://open-meteo.com">Open-Meteo</a> (CC BY 4.0)</small></footer>
    </main>
  )
}
