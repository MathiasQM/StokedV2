<template>
  <AppContainer title="All Portfolios">
    <div class="overflow-x-auto">
      <table class="w-full table-auto text-left text-sm">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column"
              class="whitespace-nowrap text-nowrap p-2"
            >
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="portfolio in portfolios"
            :key="portfolio.id"
            class="border-neutral-100 text-neutral-500 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-neutral-800/50 border-b text-sm [&>td]:whitespace-nowrap"
          >
            <td class="p-2">
              <div class="flex items-center gap-2">
                <UAvatar
                  :src="portfolio.logo"
                  size="2xs"
                  :alt="portfolio.name"
                />
                {{ portfolio.name }}
              </div>
            </td>
            <td class="p-2">{{ portfolio.owner.name }}</td>
            <td class="p-2">
              <SuperAdminPortfolioMembers :members="portfolio.members" />
            </td>
            <td class="p-2">
              {{ portfolio.subscription?.status ?? '-' }}
            </td>
            <td class="p-2">
              {{ useDateFormat(portfolio.createdAt, 'DD/MM/YYYY').value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppContainer>
</template>

<script lang="ts" setup>
import { useDateFormat } from '@vueuse/core'

const { data: portfolios } = useFetch('/api/super-admin/portfolios')
const columns = ['Name', 'Owner', 'Members', 'Subscription', 'Created At']
</script>
