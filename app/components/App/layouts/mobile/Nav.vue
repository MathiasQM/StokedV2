<template>
  <div
    ref="navElement"
    class="fixed bottom-0 flex w-full justify-center p-5 transition-all select-none"
  >
    <div
      class="h-14 border-black-100 dark:border-black-800 dark:bg-black-500/10 flex w-full max-w-92 items-center justify-evenly rounded-full border-1 bg-white/10 backdrop-blur-md"
    >
      <AppSidebarLink
        key="market"
        v-bind="{
          label: 'Market',
          icon: 'i-lucide-globe',
          to: `/market`,
        }"
      />
      <AppSidebarLink
        key="brief"
        v-bind="{
          label: 'Daily Brief',
          icon: 'i-lucide-newspaper',
          to: `/brief`,
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
    label: 'Portfolio',
    icon: 'i-lucide-briefcase-business',
    to: `/dashboard/${currentPortfolio.value?.slug}` || '',
    requireAuthentication: true,
    requirePortfolio: true,
  },
  {
    label: 'Account',
    icon: 'i-lucide-circle-user',
    to: `/account`,
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
