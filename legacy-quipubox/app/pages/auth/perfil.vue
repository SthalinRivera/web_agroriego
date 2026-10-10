<template>
  <UDashboardPage>
    <UDashboardPanel>
      <UDashboardNavbar title="Mi Perfil">
        <template #right>
          <UButton
            label="Editar perfil"
            icon="i-lucide-pencil"
            color="neutral"
            variant="outline"
            @click="editMode = true"
          />
        </template>
      </UDashboardNavbar>

      <div v-if="loading" class="flex justify-center p-12">
        <USpinner size="lg" />
        <span class="ml-3 text-muted">Cargando perfil...</span>
      </div>

      <div v-else-if="user" class="max-w-4xl mx-auto p-6 space-y-8">
        <!-- Cabecera con avatar y datos personales -->
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-default p-6">
          <div class="flex flex-col sm:flex-row items-center gap-6">
            <UAvatar
              :src="user.avatar_url || undefined"
              :alt="user.nombres"
              size="3xl"
              class="ring-4 ring-primary-100 dark:ring-primary-900"
            />
            <div class="text-center sm:text-left">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ user.nombres }} {{ user.apellidos }}
              </h1>
              <p class="text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                <UIcon name="i-lucide-mail" class="w-4" />
                {{ user.email }}
              </p>
              <p v-if="user.telefono" class="text-muted-foreground flex items-center gap-1 mt-1">
                <UIcon name="i-lucide-phone" class="w-4" />
                {{ user.telefono }}
              </p>
              <div class="mt-3">
                <UBadge :color="user.estado_acceso === 'activo' ? 'success' : 'error'" variant="solid">
                  {{ user.estado_acceso === 'activo' ? 'Cuenta activa' : 'Cuenta inactiva' }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjetas de información adicional (Empresa, Rol, Sede) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-building-2" class="text-primary" />
                <h3 class="font-semibold">Empresa</h3>
              </div>
            </template>
            <div v-if="user.empresa">
              <p class="font-medium">{{ user.empresa.nombre_comercial || user.empresa.razon_social }}</p>
              <p class="text-sm text-muted-foreground">RUC: {{ user.empresa.ruc || '—' }}</p>
            </div>
            <p v-else class="text-muted-foreground">Sin empresa asignada</p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-badge-check" class="text-primary" />
                <h3 class="font-semibold">Rol</h3>
              </div>
            </template>
            <div v-if="user.rol">
              <p class="font-medium">{{ user.rol.nombre }}</p>
              <p class="text-sm text-muted-foreground">{{ user.rol.descripcion }}</p>
            </div>
            <p v-else class="text-muted-foreground">Sin rol asignado</p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="text-primary" />
                <h3 class="font-semibold">Sede</h3>
              </div>
            </template>
            <div v-if="user.sede">
              <p class="font-medium">{{ user.sede.nombre }}</p>
              <p class="text-sm text-muted-foreground">
                {{ user.sede.ciudad }}, {{ user.sede.departamento }}
              </p>
              <UBadge variant="subtle" class="mt-2">
                {{ user.sede.tipo_sede || 'General' }}
              </UBadge>
            </div>
            <p v-else class="text-muted-foreground">Sin sede asignada</p>
          </UCard>
        </div>

        <!-- Fecha de registro -->
        <div class="text-center text-sm text-muted-foreground border-t border-default pt-6">
          Miembro desde: {{ formatDate(user.created_at) }}
        </div>
      </div>

      <div v-else class="text-center p-12 text-muted-foreground">
        No se pudo cargar el perfil. 
        <UButton label="Reintentar" @click="refresh" />
      </div>
    </UDashboardPanel>
  </UDashboardPage>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useProfile } from '~/composables/useProfile'

definePageMeta({ layout: 'dashboard' })

const { user } = useAuth()
const { fetchProfile, loading } = useProfile()
const editMode = ref(false)

function formatDate(dateString: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

async function refresh() {
  await fetchProfile()
}

// Cargar perfil si no existe
if (!user.value) {
  await refresh()
}
</script>

<style scoped>
/* Opcional: pequeños ajustes para mejorar la legibilidad */
</style>