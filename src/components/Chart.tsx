import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
  CalendarComponent,
  PolarComponent,
  MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([
  LineChart,
  BarChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
  CalendarComponent,
  PolarComponent,
  MarkLineComponent,
  CanvasRenderer,
])

export function Chart({
  option,
  height = 320,
  label = 'chart',
}: {
  option: EChartsCoreOption
  height?: number
  label?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    const c = echarts.init(ref.current)
    chart.current = c
    const ro = new ResizeObserver(() => c.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      c.dispose()
    }
  }, [])

  useEffect(() => {
    chart.current?.setOption(option, true)
  }, [option])

  return <div ref={ref} style={{ width: '100%', height }} role="img" aria-label={label} />
}
