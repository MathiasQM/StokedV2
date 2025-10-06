import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  TimeScale,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js'
import { overlayYAxis } from '@/lib/chart/overlayYAxis'
// import { gradientFlarePlugin } from '@/lib/chart/gradientFlarePlugin'
import 'chartjs-adapter-date-fns'

export default defineNuxtPlugin(() => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    overlayYAxis,
  )
  // global defaults (optional)

  ChartJS.defaults.font.family = 'Inter, sans-serif'
})
