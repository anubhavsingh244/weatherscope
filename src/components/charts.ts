import type { EChartsCoreOption } from 'echarts/core'
import type { Hourly } from '../lib/api'
import type { Climate, DayValue, HeatmapData, RangeBars, SunArc, WindRose } from '../lib/transform'
import { WIND_BINS } from '../lib/transform'

const text = '#6b7280'

export function hourlyOption(h: Hourly): EChartsCoreOption {
  return {
    color: ['#e4572e', '#8b5cf6', '#2f80ed'],
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: text } },
    grid: { left: 44, right: 44, top: 36, bottom: 28 },
    xAxis: {
      type: 'category',
      data: h.time,
      axisTick: { interval: (i: number) => i % 24 === 0 },
      axisLabel: { color: text, interval: (i: number) => i % 24 === 0, formatter: (v: string) => v.slice(5, 10) },
    },
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
    grid: { left: 80, right: 16, top: 8, bottom: 80 },
    xAxis: { type: 'category', data: g.hours.map((h) => String(h).padStart(2, '0')), splitArea: { show: true }, axisLabel: { color: text } },
    yAxis: { type: 'category', data: g.days.map((d) => d.slice(5)), inverse: true, axisLabel: { color: text } },
    visualMap: { min: opts.min, max: opts.max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: opts.colors }, textStyle: { color: text } },
    series: [{ name: opts.name, type: 'heatmap', data: g.cells, emphasis: { itemStyle: { borderColor: '#333', borderWidth: 1 } } }],
  }
}

const palette = ['#a6d8f0', '#4da3d9', '#1f6fb0', '#0b3c6e']

export function windRoseOption(w: WindRose): EChartsCoreOption {
  return {
    color: palette,
    tooltip: { trigger: 'item', formatter: (p: { seriesName: string; name: string; value: number }) => `${p.name} · ${p.seriesName}: <b>${p.value}%</b> of hours` },
    legend: { bottom: 0, textStyle: { color: text } },
    polar: { radius: ['8%', '72%'], center: ['50%', '46%'] },
    angleAxis: { type: 'category', data: w.directions, startAngle: 90 + 11.25, clockwise: true, axisLabel: { color: text } },
    radiusAxis: { axisLabel: { color: text, formatter: '{value}%' } },
    series: WIND_BINS.map((b, i) => ({
      name: b.label, type: 'bar', coordinateSystem: 'polar', stack: 'wind', data: w.series[i],
    })),
  }
}

export function calendarOption(days: DayValue[]): EChartsCoreOption {
  const vals = days.map((d) => d.value)
  const min = Math.floor(Math.min(...vals))
  const max = Math.ceil(Math.max(...vals))
  return {
    tooltip: { formatter: (p: { data: [string, number] }) => `${p.data[0]}<br/>Mean: <b>${p.data[1]}°C</b>` },
    visualMap: { min, max, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#2c7bb6', '#abd9e9', '#ffffbf', '#fdae61', '#d7191c'] }, textStyle: { color: text } },
    calendar: {
      top: 30, left: 36, right: 16, cellSize: ['auto', 14],
      range: [days[0].date, days[days.length - 1].date],
      itemStyle: { borderWidth: 2, borderColor: 'transparent' },
      yearLabel: { show: false }, dayLabel: { color: text, firstDay: 1 }, monthLabel: { color: text },
    },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: days.map((d) => [d.date, d.value]) }],
  }
}

export function climateOption(c: Climate): EChartsCoreOption {
  return {
    color: ['#e4572e', '#6b7280'],
    tooltip: { trigger: 'axis', valueFormatter: (v: number | null) => (v == null ? '–' : `${v}°C`) },
    legend: { top: 0, textStyle: { color: text } },
    grid: { left: 44, right: 16, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: c.months, axisLabel: { color: text } },
    yAxis: { type: 'value', name: '°C', axisLabel: { color: text } },
    series: [
      { name: 'Last 12 months', type: 'line', symbolSize: 6, data: c.recent },
      { name: 'Earlier years (normal)', type: 'line', lineStyle: { type: 'dashed' }, showSymbol: false, data: c.normal },
    ],
  }
}

export function rangeBarsOption(r: RangeBars): EChartsCoreOption {
  return {
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (ps: { dataIndex: number }[]) => {
        const i = ps[0].dataIndex
        return `${r.days[i]}<br/>${r.min[i]}° – <b>${r.max[i]}°C</b>`
      },
    },
    grid: { left: 44, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: r.days.map((d) => d.slice(5)), axisLabel: { color: text } },
    yAxis: { type: 'value', name: '°C', axisLabel: { color: text } },
    series: [
      { type: 'bar', stack: 'range', stackStrategy: 'all', itemStyle: { color: 'transparent' }, silent: true, data: r.min },
      {
        type: 'bar', stack: 'range', stackStrategy: 'all', barWidth: '40%', itemStyle: { color: '#f59e0b', borderRadius: 6 },
        label: { show: true, position: 'top', color: text, formatter: (p: { dataIndex: number }) => `${r.max[p.dataIndex]}°` },
        data: r.span,
      },
    ],
  }
}

export function sunArcOption(s: SunArc, nowHour: number | null): EChartsCoreOption {
  return {
    tooltip: { show: false },
    grid: { left: 24, right: 24, top: 24, bottom: 36 },
    xAxis: { type: 'value', min: 0, max: 24, interval: 3, axisLabel: { color: text, formatter: '{value}:00' } },
    yAxis: { type: 'value', min: 0, max: 1.15, show: false },
    series: [
      {
        type: 'line', smooth: true, showSymbol: false, data: s.curve, color: '#f59e0b',
        areaStyle: { opacity: 0.25 },
        markLine: nowHour == null ? undefined : {
          silent: true, symbol: 'none', lineStyle: { color: '#6b7280', type: 'dashed' },
          label: { formatter: 'now', color: text }, data: [{ xAxis: nowHour }],
        },
      },
    ],
  }
}

export function uvOption(days: string[], uv: number[]): EChartsCoreOption {
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 44, right: 16, top: 16, bottom: 28 },
    xAxis: { type: 'category', data: days.map((d) => d.slice(5)), axisLabel: { color: text } },
    yAxis: { type: 'value', name: 'UV', max: 12, axisLabel: { color: text } },
    visualMap: {
      show: false, type: 'piecewise', dimension: 1, seriesIndex: 0,
      pieces: [
        { lt: 3, color: '#4caf50' }, { gte: 3, lt: 6, color: '#fbc02d' },
        { gte: 6, lt: 8, color: '#fb8c00' }, { gte: 8, lt: 11, color: '#e53935' }, { gte: 11, color: '#8e24aa' },
      ],
    },
    series: [{ name: 'Max UV index', type: 'bar', data: uv }],
  }
}
