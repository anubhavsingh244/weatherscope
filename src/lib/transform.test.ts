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
