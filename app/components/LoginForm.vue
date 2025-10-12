<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
</script>

<template>
  <div class="flex flex-col gap-6 w-[800px]">
    <Card class="overflow-hidden">
      <CardContent class="grid p-0 md:grid-cols-2">
        <slot name="form"></slot>
        <div class="relative hidden bg-muted md:block">
          <slot name="image"></slot>
        </div>
      </CardContent>
    </Card>
    <div
      class="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary"
    >
      By clicking continue, you agree to our
      <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
    </div>
  </div>
</template>
