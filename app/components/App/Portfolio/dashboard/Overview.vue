<template>
  <div class="flex flex-col gap-3">
    <ChartsWrapper :symbol="symbol">
      <template #default="{ quoteData }">
        <Accordion type="single" collapsible v-model="openAccordionModel">
          <AccordionItem class="border-none" value="item-1">
            <ElementsCard
              enableBorderFlare
              class="group w-full flex-1 select-none min-w-[325px]"
            >
              <AccordionTrigger :showChevron="false" class="no-underline!">
                <TickerMetric
                  class="px-5"
                  :quoteData="quoteData"
                  symbol="Net asset value"
                  :hover-data="hoveredChartData"
                  :purpose="hoveredChartData ? 'chartTooltip' : 'ticker'"
                />
              </AccordionTrigger>
              <AccordionContent>
                <div v-if="quoteData && quoteData.length">
                  <ChartsLineChart
                    :key="symbol + '-news-chart'"
                    :data="quoteData"
                    :plugins="[
                      gradientLinePlugin,
                      pointerCrosshair,
                      gradientFlarePlugin,
                    ]"
                    @hovered-data="(points) => (hoveredChartData = points[0])"
                  />
                </div>
              </AccordionContent>
            </ElementsCard>
          </AccordionItem>
        </Accordion>
      </template>
    </ChartsWrapper>
  </div>
</template>

<script lang="ts" setup>
import { pointerCrosshair } from '~/lib/chart/CrosshairPlugin'
import { gradientFlarePlugin } from '~/lib/chart/gradientFlarePlugin'
import { gradientLinePlugin } from '~/lib/chart/gradientLinePlugin'
import { usePortfolio } from '@/composables/usePortfolio'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const { useManagedSetting } = usePortfolioPreferences()

const openAccordionModel = useManagedSetting('overviewAccordion', '')

definePageMeta({
  layout: 'default',
})
const symbol = 'AAPL'
const hoveredChartData = ref<any>(null)
</script>
