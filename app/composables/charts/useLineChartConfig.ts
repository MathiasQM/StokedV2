import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js'
import type { HistoricalQuote } from '@@/types/eodhd'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import { POSITIVE, NEGATIVE } from '~~/constants'

export function useLineChartConfig(data: HistoricalQuote[]) {
  // 1. Determine Trend (Positive/Negative)
  const isPositive = computed(() => {
    if (!data || data.length < 2) return true
    const first = Number(data[0]!.adjusted_close)
    const last = Number(data[data.length - 1]!.adjusted_close)
    return last - first >= 0
  })

  const trendColors = computed(() => (isPositive.value ? POSITIVE : NEGATIVE))

  // 2. Helper: Parse Date to UTC Timestamp
  function dateStringToUTCms(s: string): number {
    const parts = s.split('-').map(Number)
    const y = parts[0]
    const m = parts[1]
    const d = parts[2]
    if (y === undefined || m === undefined || d === undefined) return 0
    return Date.UTC(y, m - 1, d)
  }

  // 3. Prepare Chart Data
  const chartData = computed<ChartData<'line'>>(() => {
    if (!data) return { labels: [], datasets: [] }

    const parsedData = data.map((c) => {
      const y = Number(c.adjusted_close)
      return {
        x: dateStringToUTCms(c.date),
        y: Number.isFinite(y) ? y : null,
        // Keep extra data for tooltips/interactions if needed
        rawQuote: c,
      }
    })

    return {
      labels: data.map((c) => c.date),
      datasets: [
        {
          data: parsedData,
          fill: true,
          backgroundColor: trendColors.value.fill,
          borderColor: trendColors.value.fill,
          // Custom properties for our plugins/animations
          finalColor: trendColors.value.line,
          borderWidth: 2,
          tension: 0.25,
          pointRadius: 0,
          clip: false, // Allow drawing outside slightly if needed
        } as any,
      ],
    }
  })

  // 4. Calculate Y-Axis Stats (Min/Max/Headroom)
  const yStats = computed(() => {
    let min = Infinity
    let max = -Infinity
    let hasData = false

    for (const d of data || []) {
      const val = Number(d.adjusted_close)
      if (Number.isFinite(val)) {
        if (val < min) min = val
        if (val > max) max = val
        hasData = true
      }
    }

    if (!hasData) {
      return { min: 0, max: 1, headroom: 0.1 }
    }

    const range = max - min
    // 10% headroom on top; if flat series, give a tiny epsilon
    const headroom = range > 0 ? range * 0.1 : Math.max(1, Math.abs(max) * 0.02)
    return { min, max, headroom }
  })

  // 5. Chart Options
  const chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { intersect: false, mode: 'index' },
    layout: {
      padding: { top: 0, bottom: 15, right: 0, left: 0 },
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
            // Hide first and last tick for cleaner look
            if (index === 0 || index === ticks.length - 1) return ''
            return format(+value, 'dd MMM', { locale: da })
          },
        },
      },
      y: {
        display: false,
        min: yStats.value.min - 5, // Give some breathing room at bottom
        suggestedMax: yStats.value.max + yStats.value.headroom,
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }, // We use custom tooltips
    },
  }))

  return { chartData, chartOptions, trendColors, isPositive }
}
