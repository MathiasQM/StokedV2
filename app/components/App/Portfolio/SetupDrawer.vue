<template>
  <Drawer v-model:open="portfoliosSetupStore.open">
    <DrawerContent class="padding-env-bottom overflow-hidden h-full">
      <div>
        <img
          :src="bottomGlowOverflow"
          alt="bottom glow"
          class="absolute -bottom-60 -z-1 scale-[230%] select-none"
        />
      </div>
      <div class="mx-auto w-full max-w-sm flex flex-col justify-between">
        <div class="gradient-header relative w-full">
          <div class="flex flex-col items-center justify-center p-4 text-white">
            <DrawerTitle class="text-center"> Create a portfolio </DrawerTitle>
            <DrawerDescription class="text-center text-sm opacity-80">
              Create
            </DrawerDescription>
          </div>
        </div>

        <div
          class="w-full max-w-[400px] flex justify-center items-center gap-5"
        >
          <div
            class="bg-black-50/10 w-14 h-14 rounded-xl flex items-center justify-center -rotate-8"
          >
            <AppLogo size="w-10 h-10" />
          </div>
          <div class="flex flex-col gap-5">
            <span
              class="block bg-gradient-to-r from-white w-18 rounded-full h-[1px]"
            ></span>
            <span
              class="block bg-gradient-to-r to-white w-18 rounded-full h-[1px]"
            ></span>
          </div>
          <div
            class="bg-black-50/10 w-14 h-14 rounded-xl flex items-center justify-center rotate-12"
          >
            <Icon class="w-5 h-5" name="i-lucide-user" />
          </div>
        </div>

        <AppPortfolioTickerCloud />

        <DrawerFooter class="fixed bottom-0 w-full">
          <DrawerClose as-child>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </div>
    </DrawerContent>
  </Drawer>
</template>

<script setup lang="ts">
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { usePortfolioSetupModal } from '~~/stores/portfolioSetupModal'
import bottomGlowOverflow from '@@/public/svg/bottomGlowOverflow.svg'
import Table from '@/components/App/Portfolio/Table.vue'
const { currentPortfolio } = usePortfolio()

const portfoliosSetupStore = usePortfolioSetupModal()

// Handle successful authentication
const handleSuccess = async () => {
  portfoliosSetupStore.closePortfolioSetupModal()
  await nextTick()
  await navigateTo(`/dashboard/${currentPortfolio.value.slug}`)
}
</script>
