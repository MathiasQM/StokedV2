<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
const route = useRoute()

const activeTab = route.query.billing ? 'account-billing' : 'account-settings'
</script>

<template>
  <AppContainer title="Account Settings">
    <Tabs :default-value="activeTab" class="w-full">
      <TabsList class="mb-5 grid w-full grid-cols-2">
        <TabsTrigger class="data-[state=active]:text-orange-500 dark:data-[state=active]:text-orange-500"
          value="account-settings">
          Account
        </TabsTrigger>
        <TabsTrigger class="data-[state=active]:text-orange-500 dark:data-[state=active]:text-orange-500"
          value="account-security">
          Security
        </TabsTrigger>
      </TabsList>
      <TabsContent value="account-settings">
        <AppUserSettingsView />
      </TabsContent>
      <TabsContent value="account-security">
        <AppUserSettingsSecurity />
      </TabsContent>
    </Tabs>
  </AppContainer>
</template>
