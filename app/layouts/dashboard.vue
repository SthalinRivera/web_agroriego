<script setup lang="ts">
import { agroModules } from '~/utils/agro-modules'

const { user, logout, loading, errorMessage } = useAuth()
const open = ref(false)
const links = [
  {
    label: 'Resumen',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    exact: true
  },
  ...agroModules.map(module => ({
    label: module.title,
    icon: module.icon,
    to: `/dashboard/${module.key}`
  }))
]
const groups = computed(() => [
  { id: 'navigation', label: 'Ir a un módulo', items: links }
])
const route = useRoute()
watch(
  () => route.path,
  () => {
    open.value = false
  }
)
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="agroriego"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-2 py-3 text-primary font-semibold text-xl"
        ><UIcon name="i-lucide-sprout" class="size-7 shrink-0" /><span
          v-if="!collapsed"
        >Agroriego</span></NuxtLink>
      </template>
      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          label="Buscar módulo…"
          class="mb-3"
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />
      </template>
      <template #footer="{ collapsed }">
        <div class="w-full space-y-3">
          <div v-if="!collapsed" class="text-sm min-w-0">
            <p class="font-medium truncate">
              {{ user?.nombres }} {{ user?.apellidos }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ user?.email }}
            </p>
          </div>
          <UButton
            :label="collapsed ? undefined : 'Cerrar sesión'"
            aria-label="Cerrar sesión"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            :loading="loading"
            @click="logout"
          />
          <p v-if="errorMessage" role="alert" class="text-xs text-error">
            {{ errorMessage }}
          </p>
        </div>
      </template>
    </UDashboardSidebar>
    <UDashboardSearch :groups="groups" placeholder="Buscar módulo…" />
    <slot />
  </UDashboardGroup>
</template>
