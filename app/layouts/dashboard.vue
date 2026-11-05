<script setup lang="ts">
import { agroModules } from '~/utils/agro-modules'

const { user, logout, loading, errorMessage } = useAuth()
const open = ref(false)
const links = computed(() => [
  {
    label: 'Resumen',
    icon: 'i-lucide-layout-dashboard',
    to: '/dashboard',
    exact: true
  },
  ...agroModules.filter(module => !module.adminOnly || user.value?.roles.some(role => role.codigo === 'admin')).map(module => ({
    label: module.title,
    icon: module.icon,
    to: `/dashboard/${module.key}`
  }))
])
const groups = computed(() => [
  { id: 'navigation', label: 'Ir a un módulo', items: links.value }
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
  <UDashboardGroup unit="rem" class="agro-workspace">
    <UDashboardSidebar
      id="agroriego"
      v-model:open="open"
      collapsible
      resizable
      class="agro-sidebar bg-elevated/25"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-2 py-3 text-primary font-semibold text-xl"
        ><UIcon name="i-lucide-sprout" class="size-7 shrink-0" /><span
          v-if="!collapsed"
        >Agroriego<span class="block text-[9px] tracking-[0.2em] uppercase text-muted font-medium">Control agrícola</span></span></NuxtLink>
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
