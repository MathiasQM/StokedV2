import type { ChartData, ChartOptions } from 'chart.js'

export interface TrendColorDetails {
  line: string
  lineOpacity: string
  fill: string
  icon: string
  iconClass: string
  textClass: string
  smallBorder: string
  smallBackground: string
}

export interface TrendColors {
  positive: TrendColorDetails
  negative: TrendColorDetails
}

export interface ChartSetup {
  chartData: ChartData<'line'>
  chartOptions: ChartOptions<'line'>
  trendColors: TrendColors
}

export interface StockMetrics {
  latestValue: number
  initialValue: number
  valueChange: number
  isPositiveChange: boolean
  currentTrendColors: TrendColorDetails
  percentageChange: number
}
