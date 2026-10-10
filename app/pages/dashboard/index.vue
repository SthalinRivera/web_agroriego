<script setup lang="ts">
import type { AgroRecord, PageResult } from '~/types/agro'
import { displayValue, errorText } from '~/utils/agro'

definePageMeta({ layout: 'dashboard' })
const { user } = useAuth()
const { request } = useApi()
const cards = [
  {
    key: 'parcelas',
    title: 'Parcelas',
    icon: 'i-lucide-map',
    query: { limit: 5 }
  },
  {
    key: 'cultivos',
    title: 'Cultivos',
    icon: 'i-lucide-sprout',
    query: { limit: 1 }
  },
  {
    key: 'dispositivos',
    title: 'Dispositivos',
    icon: 'i-lucide-cpu',
    query: { limit: 1 }
  },
  {
    key: 'sensores',
    title: 'Sensores',
    icon: 'i-lucide-radio',
    query: { limit: 1 }
  },
  {
    key: 'alertas',
    title: 'Alertas activas',
    icon: 'i-lucide-triangle-alert',
    query: { limit: 5, estado: 'activa' }
  },
  {
    key: 'riegos',
    title: 'Riegos en curso',
    icon: 'i-lucide-droplets',
    query: { limit: 5, estado: 'en_curso' }
  }
]
const results = ref<Record<string, PageResult>>({})
const errors = ref<Record<string, string>>({})
const readings = ref<AgroRecord[]>([])
const busy = ref(false)
const updated = ref('')
let generation = 0
async function load() {
  const current = ++generation
  busy.value = true
  errors.value = {}
  results.value = {}
  readings.value = []
  await Promise.all([
    ...cards.map(async (card) => {
      try {
        const result = await request<PageResult>(card.key, {
          query: card.query
        })
        if (current === generation) results.value[card.key] = result
      } catch (cause) {
        if (current === generation) errors.value[card.key] = errorText(cause)
      }
    }),
    (async () => {
      try {
        const result = await request<AgroRecord[]>('lecturas/latest', {
          query: { limit: 6 }
        })
        if (current === generation) readings.value = result
      } catch (cause) {
        if (current === generation) errors.value.lecturas = errorText(cause)
      }
    })()
  ])
  if (current === generation) {
    busy.value = false
    updated.value = new Date().toISOString()
  }
}
onMounted(load)
onBeforeUnmount(() => generation++)
</script>

<template>
  <UDashboardPanel id="overview" :ui="{ body: 'block space-y-5' }">
    <template #header>
      <UDashboardNavbar title="Resumen del campo">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template><template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            label="Actualizar"
            color="neutral"
            variant="outline"
            :loading="busy"
            @click="load"
          />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-primary text-sm font-medium mb-1">
            AGRORIEGO
          </p>
          <h1 class="text-2xl font-semibold">
            Hola, {{ user?.nombres || "bienvenido" }}
          </h1>
          <p class="text-muted mt-1">
            Una vista de tus parcelas, sensores y actividad de riego.
          </p>
        </div>
        <p v-if="updated" class="text-xs text-muted">
          Última consulta: {{ displayValue(updated) }}
        </p>
      </div>
      <div class="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <NuxtLink
          v-for="card in cards"
          :key="card.key"
          :to="{
            path: '/dashboard/' + card.key,
            query: card.query.estado ? { estado: card.query.estado } : {}
          }"
          class="rounded-xl border border-default p-5 hover:bg-elevated/40 transition-colors"
        >
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm text-muted">{{ card.title }}</p>
            <UIcon :name="card.icon" class="text-primary size-5" />
          </div>
          <p class="text-3xl font-semibold mt-3">
            {{
              busy
                ? "…"
                : errors[card.key]
                  ? "—"
                  : (results[card.key]?.meta.total ?? "—")
            }}
          </p>
          <p v-if="errors[card.key]" class="text-xs text-error mt-2">
            {{ errors[card.key] }}
          </p>
          <p v-else class="text-xs text-muted mt-2">
            Ver registros <span aria-hidden="true">↗</span>
          </p>
        </NuxtLink>
      </div>
      <AgroMoistureTrend />
      <div class="grid xl:grid-cols-2 gap-5">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="font-semibold">
                Alertas activas recientes
              </h2>
              <UButton
                to="/dashboard/alertas?estado=activa"
                label="Ver todas"
                variant="link"
              />
            </div>
          </template>
          <p v-if="busy" role="status" class="text-muted">
            Cargando alertas…
          </p>
          <p v-else-if="errors.alertas" role="alert" class="text-error">
            {{ errors.alertas }}
          </p>
          <p
            v-else-if="!results.alertas?.data.length"
            class="text-muted py-8 text-center"
          >
            No hay alertas activas.
          </p>
          <div
            v-for="alert in results.alertas?.data ?? []"
            :key="String(alert.id)"
            class="py-3 border-b border-default last:border-0"
          >
            <div class="flex justify-between gap-3">
              <p class="font-medium">
                {{ alert.titulo }}
              </p>
              <UBadge color="warning" variant="soft">
                {{ alert.prioridad }}
              </UBadge>
            </div>
            <p class="text-sm text-muted mt-1">
              {{ alert.mensaje }}
            </p>
            <p class="text-xs text-muted mt-2">
              {{ displayValue(alert.created_at) }}
            </p>
          </div>
        </UCard>
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h2 class="font-semibold">
                Últimas mediciones
              </h2>
              <UButton
                to="/dashboard/lecturas"
                label="Ver historial"
                variant="link"
              />
            </div>
          </template>
          <p v-if="busy" role="status" class="text-muted">
            Cargando mediciones…
          </p>
          <p v-else-if="errors.lecturas" role="alert" class="text-error">
            {{ errors.lecturas }}
          </p>
          <p v-else-if="!readings.length" class="text-muted py-8 text-center">
            Todavía no hay lecturas registradas.
          </p>
          <div
            v-for="reading in readings"
            :key="String(reading.id)"
            class="py-3 border-b border-default last:border-0 flex justify-between gap-4"
          >
            <div>
              <p class="font-medium">
                {{ displayValue((reading.sensores as AgroRecord)?.nombre) }}
              </p>
              <p class="text-xs text-muted mt-1">
                {{ displayValue(reading.recorded_at) }}
              </p>
            </div>
            <p class="font-semibold">
              {{ displayValue(reading.valor) }}
              <span class="text-xs text-muted">{{
                ((reading.sensores as AgroRecord)?.tipos_sensor as AgroRecord)
                  ?.unidad
              }}</span>
            </p>
          </div>
        </UCard>
      </div>
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="font-semibold">
              Tus parcelas recientes
            </h2>
            <UButton
              to="/dashboard/parcelas"
              label="Ver todas"
              variant="link"
            />
          </div>
        </template>
        <p v-if="busy" role="status" class="text-muted">
          Cargando parcelas…
        </p>
        <p v-else-if="errors.parcelas" role="alert" class="text-error">
          {{ errors.parcelas }}
        </p>
        <p
          v-else-if="!results.parcelas?.data.length"
          class="text-muted py-8 text-center"
        >
          No tienes parcelas propias o compartidas registradas.
        </p>
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <NuxtLink
            v-for="parcela in results.parcelas?.data ?? []"
            :key="String(parcela.id)"
            :to="{
              path: '/dashboard/parcelas',
              query: { search: String(parcela.codigo ?? parcela.nombre) }
            }"
            class="rounded-xl border border-default p-4 hover:bg-elevated/40"
          ><p class="font-medium">{{ parcela.nombre }}</p>
            <p class="text-sm text-muted mt-1">
              {{ displayValue(parcela.departamento) }} ·
              {{ displayValue(parcela.area_hectareas) }} ha
            </p>
            <p class="text-xs text-primary mt-3">
              Consultar parcela →
            </p></NuxtLink>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
