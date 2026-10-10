<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Mi Perfil">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="profile"
            label="Editar perfil"
            icon="i-lucide-pencil"
            color="neutral"
            variant="outline"
            @click="editMode = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading skeleton -->
      <div v-if="loading" class="space-y-4 p-6">
        <USkeleton class="h-32 w-full" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <USkeleton class="h-40" />
          <USkeleton class="h-40" />
          <USkeleton class="h-40" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="p-8 text-center text-red-500">
        {{ error }}
        <UButton label="Reintentar" @click="fetchProfile" />
      </div>

      <!-- Profile data -->
      <div v-else-if="profile" class="max-w-3xl mx-auto p-6 space-y-6">
        <!-- Avatar y datos personales -->
        <UCard class="overflow-hidden">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <UAvatar
              :src="profile.avatar_url || undefined"
              :alt="profile.nombres"
              size="3xl"
              class="ring-4 ring-default"
            />
            <div class="text-center sm:text-left">
              <h2 class="text-2xl font-bold">{{ profile.nombres }} {{ profile.apellidos }}</h2>
              <p class="text-muted">{{ profile.email }}</p>
              <p v-if="profile.telefono" class="text-muted">
                <UIcon name="i-lucide-phone" class="mr-1" />
                {{ profile.telefono }}
              </p>
              <UBadge :color="profile.estado_acceso === 'activo' ? 'success' : 'error'" class="mt-2">
                {{ profile.estado_acceso }}
              </UBadge>
            </div>
          </div>
        </UCard>

        <!-- Tarjetas de Empresa, Rol y Sede -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Empresa -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-building-2" class="text-primary" />
                <h3 class="font-semibold">Empresa</h3>
              </div>
            </template>
            <div>
              <p class="font-medium">{{ profile.empresa?.nombre_comercial || profile.empresa?.razon_social }}</p>
              <p class="text-sm text-muted">RUC: {{ profile.empresa?.ruc || '—' }}</p>
            </div>
          </UCard>

          <!-- Rol -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-badge-check" class="text-primary" />
                <h3 class="font-semibold">Rol</h3>
              </div>
            </template>
            <div v-if="profile.rol">
              <p class="font-medium">{{ profile.rol.nombre }}</p>
              <p class="text-sm text-muted">{{ profile.rol.descripcion }}</p>
            </div>
            <p v-else class="text-muted">Sin rol asignado</p>
          </UCard>

          <!-- Sede -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="text-primary" />
                <h3 class="font-semibold">Sede</h3>
              </div>
            </template>
            <div v-if="profile.sede">
              <p class="font-medium">{{ profile.sede.nombre }}</p>
              <p class="text-sm text-muted">
                {{ profile.sede.ciudad }}, {{ profile.sede.departamento }}
              </p>
              <UBadge variant="subtle" class="mt-2">
                {{ profile.sede.tipo_sede || 'General' }}
              </UBadge>
            </div>
            <p v-else class="text-muted">Sin sede asignada</p>
          </UCard>
        </div>

        <!-- Fecha de registro -->
        <div class="text-center text-sm text-muted border-t border-default pt-4">
          Miembro desde: {{ new Date(profile.created_at).toLocaleDateString('es-ES') }}
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { useProfile } from '~/composables/useProfile'

const { profile, loading, error, fetchProfile } = useProfile()
const editMode = ref(false)

onMounted(() => {
  fetchProfile()
})

definePageMeta({
  layout: 'dashboard'
})
</script>