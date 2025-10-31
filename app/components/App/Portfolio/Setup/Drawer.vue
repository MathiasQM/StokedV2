<template>
  <template v-if="!isMobile">
    <Dialog v-model:open="portfoliosSetupStore.open">
      <DialogContent class="overflow-hidden min-h-[500px]">
        <div class="absolute -top-10 inset-0 -z-10 flex justify-center">
          <div class="linear-gradient-layer absolute -z-1"></div>
          <div class="linear-gradient-layer-bottom absolute -z-1"></div>
          <div class="radial-gradient-layer absolute -z-1"></div>
        </div>
        <div class="mx-auto w-full max-w-sm flex flex-col justify-between">
          <div class="gradient-header relative w-full">
            <div
              class="flex flex-col items-center justify-center p-4 text-white"
            >
              <DialogTitle class="text-center">
                Create a portfolio
              </DialogTitle>
              <DialogDescription class="text-center text-sm opacity-80">
                Add instruments to your portfolio
              </DialogDescription>
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
          </div>

          <AppPortfolioSetupTickerCloud />
        </div>
        <div class="flex flex-col gap-5">
          <AppStockSearchBar @add="handleAddStock" />
          <div class="w-full flex justify-evenly gap-2">
            <DialogClose as-child>
              <Button variant="outline" class="w-1/2">Cancel</Button>
            </DialogClose>
            <Button
              @click="handleCreatePortfolio"
              :disabled="
                isCreating ||
                !portfolioName.trim() ||
                newPortfolioPositions.length === 0
              "
              variant="default"
              class="w-1/2"
            >
              <Icon
                v-if="isCreating"
                name="i-lucide-loader-2"
                class="w-4 h-4 mr-2 animate-spin"
              />
              Create Portfolio
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </template>

  <template v-else>
    <Drawer v-model:open="portfoliosSetupStore.open">
      <DrawerContent
        class="padding-env-bottom overflow-hidden h-full w-full flex flex-col justify-start"
      >
        <div>
          <img
            :src="bottomGlowOverflow"
            alt="bottom glow"
            class="absolute -bottom-60 -z-1 scale-[230%] select-none"
          />
        </div>
        <div class="w-full flex flex-col items-center justify-around">
          <div
            class="gradient-header relative w-full flex justify-center flex-col items-center"
          >
            <div
              class="flex flex-col items-center justify-center w-full p-4 text-white"
            >
              <DrawerTitle class="text-center text-xl">
                Create a portfolio
              </DrawerTitle>
              <DrawerDescription class="text-center text-sm opacity-80">
                Add instruments to your portfolio
              </DrawerDescription>
            </div>
            <div class="w-full flex justify-center items-center gap-5">
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
          </div>

          <div class="p-5">
            <AppPortfolioTable disable-actions is-editing />
          </div>

          <!-- <AppPortfolioSetupTickerCloud /> -->
        </div>
        <DrawerFooter>
          <!-- <AppStockSearchBar @add="handleAddStock" /> -->

          <Button
            @click="handleCreatePortfolio"
            :disabled="
              isCreating ||
              !portfolioName.trim() ||
              newPortfolioPositions.length === 0
            "
            variant="default"
            class="mt-2"
          >
            <Icon
              v-if="isCreating"
              name="i-lucide-loader-2"
              class="w-4 h-4 mr-2 animate-spin"
            />
            Create Portfolio
          </Button>
          <DrawerClose as-child>
            <Button variant="secondary">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  </template>
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
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { usePortfolioSetupModal } from '~~/stores/portfolioSetupModal'
import bottomGlowOverflow from '@@/public/svg/bottomGlowOverflow.svg'
import type { TickerMeta } from '@@/types/eodhd'
import DialogClose from '~/components/ui/dialog/DialogClose.vue'

const toast = useToast()
const router = useRouter()

const isMobile = useIsMobile()
const {
  addPosition,
  clearNewPortfolio,
  createPortfolio,
  newPortfolioPositions,
} = usePortfolio()
const portfoliosSetupStore = usePortfolioSetupModal()

const portfolioName = ref('New portfolio')
const isCreating = ref(false)

const handleAddStock = (stock: TickerMeta) => {
  addPosition(stock)
}

async function handleCreatePortfolio() {
  if (!portfolioName.value.trim() || newPortfolioPositions.value.length === 0) {
    toast.add({
      title: 'Missing Information',
      description: 'Please name your portfolio and add at least one stock.',
      color: 'error',
    })
    return
  }

  isCreating.value = true
  try {
    const newPortfolio = await createPortfolio({
      name: portfolioName.value,
      positions: newPortfolioPositions.value.map((p) => ({
        symbol: `${p.Code}.${p.Exchange === 'NASDAQ' || p.Exchange === 'NYSE' ? 'US' : p.Exchange}`,
        name: p.Name,
        exchange: p.Exchange,
        shares: 0,
        costPerShare: 0,
      })),
    })

    toast.add({
      title: 'Success!',
      description: `Portfolio "${newPortfolio.name}" created.`,
    })

    portfoliosSetupStore.closePortfolioSetupModal()
    await navigateTo(`/dashboard/${newPortfolio.slug}`)
  } catch (error: any) {
    toast.add({
      title: 'Error creating portfolio',
      description: error.data?.message || 'An unexpected error occurred.',
      color: 'error',
    })
  } finally {
    isCreating.value = false
  }
}

watch(
  () => portfoliosSetupStore.open,
  (isOpen) => {
    if (!isOpen) {
      clearNewPortfolio()
      portfolioName.value = ''
    }
  },
)
</script>
