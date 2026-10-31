import type { Hourly } from './api'

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
