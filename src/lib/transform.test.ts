import { describe, expect, it } from 'vitest'
import { toHourDayGrid } from './transform'

describe('toHourDayGrid', () => {
  it('maps hourly values into hour × day cells', () => {
    const time = ['2026-10-31T00:00', '2026-10-31T01:00', '2026-11-01T00:00']
    const g = toHourDayGrid(time, [10, 11, null])
    expect(g.days).toEqual(['2026-10-31', '2026-11-01'])
    expect(g.hours).toHaveLength(24)
    expect(g.cells).toEqual([
      [0, 0, 10],
      [1, 0, 11],
      [0, 1, null],
    ])
  })
})

import { climateComparison, lastDays, rangeBars, sunArc, windRose } from './transform'

describe('windRose', () => {
  it('bins direction into compass sectors and speed bands as percentages', () => {
    const r = windRose([5, 15, 35, null], [0, 90, 359, 180])
    expect(r.directions).toHaveLength(16)
    // 3 valid hours -> each ~33.3%
    expect(r.series[0][0]).toBeCloseTo(33.3, 1) // 5 km/h from N
    expect(r.series[1][4]).toBeCloseTo(33.3, 1) // 15 km/h from E
    expect(r.series[3][0]).toBeCloseTo(33.3, 1) // 35 km/h from 359° -> N
  })
})

describe('history transforms', () => {
  it('lastDays drops nulls and keeps the tail', () => {
    expect(lastDays(['a', 'b', 'c'], [1, null, 3], 1)).toEqual([{ date: 'c', value: 3 }])
  })

  it('climateComparison splits recent window from earlier normal per month', () => {
    const time = ['2020-01-01', '2020-01-02', '2021-01-01']
    const c = climateComparison(time, [0, 10, 20], 1)
    expect(c.normal[0]).toBe(5)
    expect(c.recent[0]).toBe(20)
    expect(c.recent[1]).toBeNull()
  })
})

describe('daily transforms', () => {
  it('rangeBars computes the stacked span', () => {
    const r = rangeBars({
      time: ['d'], temperature_2m_max: [12.5], temperature_2m_min: [4], uv_index_max: [3], sunrise: [], sunset: [],
    })
    expect(r.span).toEqual([8.5])
  })

  it('sunArc spans sunrise to sunset and peaks at solar noon', () => {
    const s = sunArc('2026-06-21T05:00', '2026-06-21T21:00')
    expect(s.daylightHours).toBe(16)
    expect(s.curve[0]).toEqual([5, 0])
    expect(Math.max(...s.curve.map((p) => p[1]))).toBe(1)
  })
})
