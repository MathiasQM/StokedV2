import LogoChip from './widgets/LogoChip.vue'
import KPIList from './widgets/KPIList.vue'
import PriceChart from './widgets/PriceChart.vue'
import ImagePanel from './widgets/ImagePanel.vue'

export const REGISTRY: Record<string, any> = {
  LogoChip,
  KPIList,
  PriceChart,
  ImagePanel,
}

export function resolve(type: string) {
  return REGISTRY[type] ?? (() => null)
}
