import type { ChartData, ChartOptions } from 'chart.js'
import type { HistoricalQuote } from '@@/types/eodhd'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import { POSITIVE, NEGATIVE } from '~~/constants'

export function useChartUI(data: HistoricalQuote[]) {
  const isPositive = computed(() => {
    if (!data || data.length < 2) return true
    const first = Number(data[0]!.adjusted_close)
    const last = Number(data[data.length - 1]!.adjusted_close)
    return last - first >= 0
  })

  const trendColors = computed(() => {
    return isPositive.value ? POSITIVE : NEGATIVE
  })

  function dateStringToUTCms(s: string): number {
    const [y, m, d] = s.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }

  const chartData = computed<ChartData<'line'>>(() => ({
    labels: data?.map((c) => c.date) ?? [],
    datasets: [
      {
        data:
          data?.map((c) => {
            const ts = dateStringToUTCms(c.date)
            const y = Number(c.adjusted_close)
            return {
              x: ts,
              y: isFinite(y) ? y : null,
              volume: c.volume,
              high: c.high,
              low: c.low,
            }
          }) ?? [],
        fill: true,
        backgroundColor: trendColors.value.fill,
        borderColor: trendColors.value.fill,
        finalColor: trendColors.value.line,
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 0,
        clip: true,
      } as any,
    ],
  }))

  const yStats = computed(() => {
    const ys = (data ?? [])
      .map((d) => Number(d.adjusted_close))
      .filter((v) => Number.isFinite(v))

    // handle empty / all-bad data defensively
    if (ys.length === 0) {
      return { min: 0, max: 1, headroom: 0.1 }
    }

    const min = Math.min(...ys)
    const max = Math.max(...ys)
    const range = max - min

    // 10% headroom on top; if flat series, give a tiny epsilon so Chart.js has a range
    const headroom = range > 0 ? range * 0.1 : Math.max(1, Math.abs(max) * 0.02)
    return { min, max, headroom }
  })

  const chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { intersect: false, mode: 'index' },
    layout: {
      padding: {
        top: 0,
        bottom: 15,
        right: 0,
        left: 0,
      },
    },
    scales: {
      x: {
        type: 'time',
        offset: false,
        bounds: 'data',
        time: {
          unit: 'day',
          parser: 'yyyy-MM-dd',
          displayFormats: {
            day: 'dd MMM',
            month: 'MMM yyyy',
          },
          tooltipFormat: 'PP',
        },
        grid: { display: false },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 6,
          color: '#b0b0b0',
          callback(value, index, ticks) {
            if (index === 0 || index === ticks.length - 1) return ''
            const ts = +value
            return format(ts, 'dd MMM', { locale: da })
          },
        },
      },
      y: {
        display: false,
        min: yStats.value.min - 5,
        suggestedMax: yStats.value.max + yStats.value.headroom,
        ticks: {
          count: 8,
          callback: (v) => Number(v).toFixed(0),
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        intersect: false,
        mode: 'index',
      },
    },
  }))

  return { chartData, chartOptions, trendColors, isPositive }
}
