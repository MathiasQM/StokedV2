<template>
  <div
    ref="navElement"
    class="padding-env-bottom fixed bottom-0 flex w-full justify-center p-5 transition-all"
  >
    <div
      class="border-black-100 dark:border-black-800 dark:bg-black-500/10 flex w-full max-w-92 items-center justify-evenly rounded-lg border-1 bg-white/10 backdrop-blur-md"
    >
      <AppSidebarLink
        key="poc"
        v-bind="{
          label: 'Poc',
          icon: 'i-lucide-globe',
          to: `/dev/poc`,
        }"
      />
      <AppSidebarLink
        key="market"
        v-bind="{
          label: 'Market',
          icon: 'i-lucide-globe',
          to: `/market`,
        }"
      />
      <AppSidebarLink v-for="link in links" :key="link.to" v-bind="link" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { usePortfolio } from '@/composables/usePortfolio'

const { currentPortfolio, portfolios } = usePortfolio()

const links = computed(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-chart-spline',
    to: `/dashboard/${currentPortfolio.value?.slug}` || '',
    requirePortfolio: true,
    requireAuthentication: true,
  },
  {
    label: 'News',
    icon: 'i-lucide-newspaper',
    to: `/dashboard/${currentPortfolio.value?.slug}/news` || '',
    requirePortfolio: true,
    requireAuthentication: true,
  },
])

const wrapperRef = inject<Ref<HTMLDivElement | null>>('wrapperRef')
const navElement = ref<HTMLDivElement | null>(null)

let prevScrollPos = 0

const handleScroll = () => {
  const el = wrapperRef?.value
  if (!el) return
  const isMobile = window.innerWidth <= 768
  const currentScrollPos = el.scrollTop

  if (currentScrollPos < 200) {
    navElement.value!.style.bottom = '0px'
    prevScrollPos = currentScrollPos
    return
  }

  if (isMobile) {
    navElement.value!.style.bottom =
      prevScrollPos > currentScrollPos ? '0px' : '-100px'
  }

  prevScrollPos = currentScrollPos
}

onMounted(() => {
  if (wrapperRef?.value) {
    prevScrollPos = wrapperRef.value.scrollTop
    wrapperRef.value.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  wrapperRef?.value?.removeEventListener('scroll', handleScroll)
})
</script>
