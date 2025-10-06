<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useChartSetup } from '~/composables/useChartSetup';
const {
  chartData,
  chartOptions,
  initialValue,
  latestValue,
  valueChange,
  trendColors,
  hoveredIndexes,
} = useChartSetup();

const screenWidth = ref(0);

if (import.meta.client) {
  screenWidth.value = window.innerWidth;
}

chartOptions.value.layout.padding.top = screenWidth.value < 768 ? 50 : 100;
</script>

<template>
  <ChartsElementsStockInfo
    :latestValue="latestValue"
    :initialValue="initialValue"
    :valueChange="valueChange"
    :trendColors="trendColors"
  />

  <ChartsLine
    :data="chartData"
    :options="chartOptions"
    :trendColors="trendColors"
  />
</template>
