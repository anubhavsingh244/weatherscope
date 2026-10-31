import type { Daily, Hourly } from './api'

export interface HeatmapData {
  days: string[] // YYYY-MM-DD
  hours: number[] // 0..23
  cells: [hourIndex: number, dayIndex: number, value: number | null][]
}

/** Reshape a flat hourly series into hour-of-day × day cells for a heatmap. */
export function toHourDayGrid(time: string[], values: (number | null)[]): HeatmapData {
  const days: string[] = []
  const cells: HeatmapData['cells'] = []
  time.forEach((t, i) => {
    const [day, clock] = t.split('T')
    const hour = Number(clock.slice(0, 2))
    let d = days.indexOf(day)
    if (d === -1) {
      days.push(day)
      d = days.length - 1
    }
    cells.push([hour, d, values[i] ?? null])
  })
  return { days, hours: Array.from({ length: 24 }, (_, h) => h), cells }
}

export function temperatureGrid(h: Hourly): HeatmapData {
  return toHourDayGrid(h.time, h.temperature_2m)
}

export function precipitationGrid(h: Hourly): HeatmapData {
  return toHourDayGrid(h.time, h.precipitation_probability)
}

// ---------- Wind rose ----------

export const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
export const WIND_BINS = [
  { label: '0–10 km/h', max: 10 },
  { label: '10–20', max: 20 },
  { label: '20–30', max: 30 },
  { label: '30+', max: Infinity },
]

export interface WindRose {
  directions: string[]
  /** series[binIndex][directionIndex] = share of hours (%) */
  series: number[][]
}

/** Bin hourly wind into 16 compass sectors × speed bands, as % of all valid hours. */
export function windRose(speed: (number | null)[], dir: (number | null)[]): WindRose {
  const series = WIND_BINS.map(() => COMPASS.map(() => 0))
  let n = 0
  speed.forEach((s, i) => {
    const d = dir[i]
    if (s == null || d == null) return
    const sector = Math.round((((d % 360) + 360) % 360) / 22.5) % 16
    const bin = WIND_BINS.findIndex((b) => s < b.max)
    series[bin][sector] += 1
    n += 1
  })
  if (n > 0) for (const row of series) row.forEach((_, i) => (row[i] = +((row[i] / n) * 100).toFixed(1)))
  return { directions: COMPASS, series }
}

// ---------- History / climate ----------

export interface DayValue {
  date: string
  value: number
}

/** Last `days` days of valid daily values (for the calendar heatmap). */
export function lastDays(time: string[], values: (number | null)[], days = 365): DayValue[] {
  const out: DayValue[] = []
  time.forEach((date, i) => {
    const v = values[i]
    if (v != null) out.push({ date, value: v })
  })
  return out.slice(-days)
}

export interface Climate {
  months: string[]
  recent: (number | null)[] // mean of the last-365-day window, per calendar month
  normal: (number | null)[] // mean of all earlier years, per calendar month
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Compare the most recent 365 days against the earlier "normal", month by month. */
export function climateComparison(time: string[], values: (number | null)[], days = 365): Climate {
  // Split the window by date position *before* dropping nulls, so gaps don't shift the boundary.
  const all = time.map((date, i) => ({ date, v: values[i] }))
  const cut = Math.max(0, all.length - days)
  const acc = (rows: typeof all) => {
    const sum = Array(12).fill(0)
    const cnt = Array(12).fill(0)
    for (const r of rows) {
      if (r.v == null) continue
      const m = Number(r.date.slice(5, 7)) - 1
      sum[m] += r.v
      cnt[m] += 1
    }
    return sum.map((s, m) => (cnt[m] ? +(s / cnt[m]).toFixed(1) : null))
  }
  return { months: MONTHS, recent: acc(all.slice(cut)), normal: acc(all.slice(0, cut)) }
}

// ---------- Daily: range bars, sun arc ----------

export interface RangeBars {
  days: string[]
  min: number[]
  span: number[] // max - min, stacked on a transparent min bar
  max: number[]
}

export function rangeBars(d: Daily): RangeBars {
  return {
    days: d.time,
    min: d.temperature_2m_min,
    max: d.temperature_2m_max,
    span: d.temperature_2m_max.map((mx, i) => +(mx - d.temperature_2m_min[i]).toFixed(1)),
  }
}

export interface SunArc {
  sunrise: string
  sunset: string
  daylightHours: number
  /** [hour-of-day (decimal), relative height 0..1] */
  curve: [number, number][]
}

const decimalHour = (iso: string) => {
  const [h, m] = iso.split('T')[1].split(':').map(Number)
  return h + m / 60
}

/** Idealised daylight arc (sine between sunrise and sunset) for one day. */
export function sunArc(sunrise: string, sunset: string, steps = 48): SunArc {
  const a = decimalHour(sunrise)
  const b = decimalHour(sunset)
  const curve: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    curve.push([+(a + (b - a) * t).toFixed(2), +Math.sin(Math.PI * t).toFixed(3)])
  }
  return { sunrise: sunrise.split('T')[1], sunset: sunset.split('T')[1], daylightHours: +(b - a).toFixed(1), curve }
}
