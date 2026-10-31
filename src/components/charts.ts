import type { EChartsCoreOption } from 'echarts/core'
import type { Hourly } from '../lib/api'
import type { HeatmapData } from '../lib/transform'

const text = '#6b7280'

export function hourlyOption(h: Hourly): EChartsCoreOption {
  return {
    color: ['#e4572e', '#8b5cf6', '#2f80ed'],
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: text } },
    grid: { left: 44, right: 44, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: h.time, axisLabel: { color: text, formatter: (v: string) => v.slice(5, 10) } },
    yAxis: [
      { type: 'value', name: '°C', axisLabel: { color: text } },
      { type: 'value', name: 'mm', axisLabel: { color: text }, splitLine: { show: false } },
    ],
    series: [
      { name: 'Temperature', type: 'line', showSymbol: false, smooth: true, data: h.temperature_2m },
      { name: 'Feels like', type: 'line', showSymbol: false, smooth: true, lineStyle: { type: 'dashed' }, data: h.apparent_temperature },
      { name: 'Precipitation', type: 'bar', yAxisIndex: 1, data: h.precipitation },
    ],
  }
}

export function heatmapOption(
  g: HeatmapData,
  opts: { name: string; unit: string; min: number; max: number; colors: string[] },
): EChartsCoreOption {
  return {
    tooltip: {
      formatter: (p: { data: [number, number, number | null] }) => {
        const [x, y, v] = p.data
        return `${g.days[y]} ${String(x).padStart(2, '0')}:00<br/>${opts.name}: <b>${v ?? '–'}${opts.unit}</b>`
      },
    },
    grid: { left: 80, right: 16, top: 8, bottom: 56 },
    xAxis: { type: 'category', data: g.hours.map((h) => String(h).padStart(2, '0')), splitArea: { show: true }, axisLabel: { color: text } },
    yAxis: { type: 'category', data: g.days.map((d) => d.slice(5)), inverse: true, axisLabel: { color: text } },
    visualMap: { min: opts.min, max: opts.max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: opts.colors }, textStyle: { color: text } },
    series: [{ name: opts.name, type: 'heatmap', data: g.cells, emphasis: { itemStyle: { borderColor: '#333', borderWidth: 1 } } }],
  }
}
