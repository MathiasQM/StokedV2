<script setup lang="ts">
import { h, ref, type Ref } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { FlexRender, getCoreRowModel, useVueTable } from '@tanstack/vue-table'
import type { Updater } from '@tanstack/vue-table'
import { PlusCircle, X } from 'lucide-vue-next'

// --- UI COMPONENT IMPORTS WITH ALIASES ---
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table as ShadcnTable,
  TableBody as ShadcnTableBody,
  TableCell as ShadcnTableCell,
  TableHead as ShadcnTableHead,
  TableHeader as ShadcnTableHeader,
  TableRow as ShadcnTableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast/use-toast'

// --- UTILITIES & INTERFACES ---
function valueUpdater<T extends Updater<any>>(
  updaterOrValue: T,
  refValue: Ref<any>,
) {
  refValue.value =
    typeof updaterOrValue === 'function'
      ? updaterOrValue(refValue.value)
      : updaterOrValue
}

export interface Stock {
  id: string
  ticker: string
  name: string
  change: number
  // Removed price and marketCap as they are no longer displayed
}

const { toast } = useToast()

// --- DATA & STATE MANAGEMENT ---
const newTicker = ref('')
const isAdding = ref(false)

// Initial portfolio data, starting with a few examples.
const data = ref<Stock[]>([
  { id: 'aapl', ticker: 'AAPL', name: 'Apple Inc.', change: -0.89 },
  { id: 'msft', ticker: 'MSFT', name: 'Microsoft Corp.', change: 1.52 },
  { id: 'tsla', ticker: 'TSLA', name: 'Tesla, Inc.', change: 2.11 },
])

// --- MOCK API & CORE LOGIC ---
/**
 * Simulates fetching stock data from an API.
 * @param ticker The stock ticker to look up.
 */
async function fetchStockData(ticker: string): Promise<Stock | null> {
  console.log(`Searching for ${ticker}...`)
  // This mock simulates a network delay. In a real app, this would be a fetch request.
  await new Promise((resolve) => setTimeout(resolve, 600))

  const tickerUpper = ticker.toUpperCase()
  // Mock database now only contains the required fields
  const mockDatabase: Record<string, Omit<Stock, 'id' | 'ticker'>> = {
    GOOGL: { name: 'Alphabet Inc.', change: 0.25 },
    AMZN: { name: 'Amazon.com, Inc.', change: -1.2 },
    NVDA: { name: 'NVIDIA Corp.', change: 3.45 },
  }

  if (mockDatabase[tickerUpper]) {
    return {
      id: ticker.toLowerCase(),
      ticker: tickerUpper,
      ...mockDatabase[tickerUpper],
    }
  }
  return null
}

async function addStock() {
  if (!newTicker.value.trim()) return

  isAdding.value = true
  const tickerToAdd = newTicker.value.trim()

  if (
    data.value.some(
      (stock) => stock.ticker.toLowerCase() === tickerToAdd.toLowerCase(),
    )
  ) {
    toast({
      title: 'Duplicate Stock',
      description: `${tickerToAdd.toUpperCase()} is already in your portfolio.`,
      variant: 'destructive',
    })
    isAdding.value = false
    return
  }

  const newStock = await fetchStockData(tickerToAdd)
  isAdding.value = false

  if (newStock) {
    data.value.unshift(newStock) // Add new stock to the top of the list
    newTicker.value = ''
    toast({
      title: 'Success!',
      description: `${newStock.name} has been added to your portfolio.`,
    })
  } else {
    toast({
      title: 'Stock Not Found',
      description: `Could not find data for the ticker "${tickerToAdd.toUpperCase()}".`,
      variant: 'destructive',
    })
  }
}

function removeStock(id: string) {
  const stockToRemove = data.value.find((stock) => stock.id === id)
  data.value = data.value.filter((stock) => stock.id !== id)
  if (stockToRemove) {
    toast({
      title: `${stockToRemove.ticker} Removed`,
      description: `${stockToRemove.name} has been removed from your portfolio.`,
    })
  }
}

// --- TABLE COLUMN DEFINITIONS (Refactored to 4 columns) ---
const columns: ColumnDef<Stock>[] = [
  {
    accessorKey: 'ticker',
    header: 'Ticker',
    cell: ({ row }) => h('div', { class: 'font-bold' }, row.getValue('ticker')),
  },
  {
    accessorKey: 'name',
    header: 'Company Name',
  },
  {
    accessorKey: 'change',
    header: () => h('div', { class: 'text-right' }, 'Today(%)'),
    cell: ({ row }) => {
      const change: number = row.getValue('change')
      const colorClass = change >= 0 ? 'text-green-500' : 'text-red-500'
      const sign = change >= 0 ? '+' : ''
      return h(
        'div',
        { class: `text-right font-medium ${colorClass}` },
        `${sign}${change.toFixed(2)}%`,
      )
    },
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Opts'),
    cell: ({ row }) => {
      return h('div', { class: 'text-right' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            onClick: () => removeStock(row.original.id),
          },
          () => h(X, { class: 'h-4 w-4 text-muted-foreground' }),
        ),
      ])
    },
  },
]

// Create reactive table instance
const table = useVueTable({
  get data() {
    return data.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div class="w-full p-5">
    <!-- Search and Add Controls -->
    <div class="flex items-center gap-2 py-4">
      <Input
        v-model="newTicker"
        class="max-w-sm"
        placeholder="Search for a stock ticker (e.g., GOOGL)..."
        @keyup.enter="addStock"
      />
      <Button @click="addStock" :disabled="isAdding">
        <PlusCircle class="mr-2 h-4 w-4" />
        {{ isAdding ? 'Adding...' : 'Add' }}
      </Button>
    </div>

    <!-- Portfolio Table -->
    <div class="rounded-md border bg-black-950/70 h-60">
      <ShadcnTable>
        <ShadcnTableHeader>
          <ShadcnTableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <ShadcnTableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </ShadcnTableHead>
          </ShadcnTableRow>
        </ShadcnTableHeader>
        <ShadcnTableBody>
          <template v-if="table.getRowModel().rows?.length">
            <ShadcnTableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
            >
              <ShadcnTableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
              >
                <FlexRender
                  :render="cell.column.columnDef.cell"
                  :props="cell.getContext()"
                />
              </ShadcnTableCell>
            </ShadcnTableRow>
          </template>
          <ShadcnTableRow v-else>
            <ShadcnTableCell
              :colspan="columns.length"
              class="h-24 text-center text-muted-foreground"
            >
              Your portfolio is empty. Add a stock to get started.
            </ShadcnTableCell>
          </ShadcnTableRow>
        </ShadcnTableBody>
      </ShadcnTable>
    </div>
  </div>
</template>
