<script setup lang="ts">
import { agroModules } from '~/utils/agro-modules'
import { errorText, displayValue } from '~/utils/agro'
import type { AgroRecord, PageResult } from '~/types/agro'

definePageMeta({ layout: 'dashboard', key: route => route.path })
const route = useRoute()
const module = agroModules.find(item => item.key === route.params.module)
if (!module)
  throw createError({ statusCode: 404, statusMessage: 'Módulo no encontrado' })
const { request, all } = useApi()
const filters = reactive<Record<string, string>>(
  Object.fromEntries(
    module.filters.map(filter => [
      filter.key,
      String(route.query[filter.key] ?? '')
    ])
  )
)
const options = ref<Record<string, AgroRecord[]>>({})
const optionsError = ref('')
const rows = ref<AgroRecord[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const busy = ref(false)
const error = ref('')
const detailOpen = ref(false)
const detail = ref<unknown>(null)
const detailError = ref('')
const detailBusy = ref(false)
const selected = ref<AgroRecord | null>(null)
const actionBusy = ref(false)
const testBusy = ref(false)
const testResult = ref('')
const testError = ref('')
const notificationRevision = useState('notification-revision', () => 0)
watch(notificationRevision, () => {
  if (module!.key === 'notificaciones') void load()
})
async function saved() {
  detailOpen.value = false
  await load()
}
async function readAll() {
  if (actionBusy.value) return
  actionBusy.value = true
  try {
    await request('notificaciones/leer-todas', { method: 'PUT', body: {} })
    notificationRevision.value++
    await load()
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    actionBusy.value = false
  }
}
async function sendTestNotification() {
  if (testBusy.value) return
  testBusy.value = true
  testResult.value = ''
  testError.value = ''
  try {
    const result = await request<{ message: string }>('notificaciones/prueba', {
      method: 'POST',
      body: {}
    })
    testResult.value = result.message
    notificationRevision.value++
    await load()
  } catch (cause) {
    testError.value = errorText(cause)
  } finally {
    testBusy.value = false
  }
}
const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
let generation = 0
let detailGeneration = 0

async function loadOptions() {
  optionsError.value = ''
  const sources = [
    ...new Set(
      module!.filters.flatMap(filter =>
        filter.source ? [filter.source] : []
      )
    )
  ]
  await Promise.all(
    sources.map(async (source) => {
      try {
        options.value[source] = await all(source)
      } catch (cause) {
        optionsError.value = errorText(cause)
      }
    })
  )
}
async function load() {
  const current = ++generation
  busy.value = true
  error.value = ''
  rows.value = []
  try {
    if (filters.desde && filters.hasta && filters.desde > filters.hasta)
      throw new Error('El inicio del periodo debe ser anterior al final.')
    const query: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(filters)) {
      if (value)
        query[key]
          = key === 'desde'
            ? value + 'T00:00:00-05:00'
            : key === 'hasta'
              ? value + 'T23:59:59.999-05:00'
              : value
    }
    let endpoint = module!.endpoint
    if (module!.key === 'configuracion-alertas') {
      if (!filters.parcelaId) {
        total.value = 0
        return
      }
      endpoint += '/' + encodeURIComponent(filters.parcelaId)
      delete query.parcelaId
    }
    if (module!.paginated) {
      query.page = page.value
      query.limit = pageSize
    }
    const result = await request<PageResult | AgroRecord[] | AgroRecord | null>(
      endpoint,
      { query }
    )
    if (current !== generation) return
    if (module!.paginated) {
      const paginated = result as PageResult
      rows.value = paginated.data
      total.value = paginated.meta.total
    } else {
      rows.value = Array.isArray(result)
        ? result
        : result
          ? [result as AgroRecord]
          : []
      total.value = rows.value.length
    }
  } catch (cause) {
    if (current === generation) {
      total.value = 0
      error.value
        = cause instanceof Error && cause.message.startsWith('El inicio')
          ? cause.message
          : errorText(cause)
    }
  } finally {
    if (current === generation) busy.value = false
  }
}
function applyFilters() {
  page.value = 1
  void load()
}
function changePage(next: number) {
  page.value = next
  void load()
}
async function inspect(row: AgroRecord) {
  const current = ++detailGeneration
  selected.value = row
  detail.value = null
  detailError.value = ''
  detailOpen.value = true
  detailBusy.value = true
  try {
    const id = encodeURIComponent(String(row.id))
    const endpoint
      = module!.key === 'parcelas'
        ? 'parcelas/dashboard/' + id
        : module!.key === 'modelos-ia'
          ? 'modelos-ia/' + id + '/metricas'
          : module!.endpoint + '/' + id
    const result = module!.detail ? await request<AgroRecord>(endpoint) : row
    if (current !== detailGeneration) return
    detail.value = result
    if (module!.key === 'sensores') {
      try {
        const stats = await request<unknown>(
          'lecturas/sensor/' + id + '/estadisticas'
        )
        if (current === detailGeneration)
          detail.value = { ...result, estadisticas: stats }
      } catch (cause) {
        if (current === detailGeneration) detailError.value = errorText(cause)
      }
    }
  } catch (cause) {
    if (current === detailGeneration) detailError.value = errorText(cause)
  } finally {
    if (current === detailGeneration) detailBusy.value = false
  }
}
async function markRead() {
  if (!selected.value) return
  actionBusy.value = true
  try {
    await request(
      'notificaciones/'
      + encodeURIComponent(String(selected.value.id))
      + '/leer',
      { method: 'PUT', body: { leida: !selected.value.leida } }
    )
    detailOpen.value = false
    notificationRevision.value++
    await load()
  } catch (cause) {
    detailError.value = errorText(cause)
  } finally {
    actionBusy.value = false
  }
}
onMounted(() => {
  void loadOptions()
  void load()
})
onBeforeUnmount(() => {
  generation++
  detailGeneration++
})
useSeoMeta({ title: module.title + ' | Agroriego' })
</script>

<template>
  <UDashboardPanel :id="module.key" :ui="{ body: 'block space-y-5' }">
    <template #header>
      <UDashboardNavbar :title="module.title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template><template #right>
          <AgroThemeToggle />
          <AgroNotifications />
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
      <div class="agro-module-heading">
        <div>
          <p class="agro-eyebrow">
            GESTIÓN DEL CAMPO
          </p>
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ module.title }}
          </h1>
        </div>
        <AgroActions
          :module-key="module.key"
          :endpoint="module.endpoint"
          @saved="saved"
        />
      </div>
      <div v-if="module.key === 'notificaciones'" class="space-y-3">
        <UButton
          label="Enviar notificación de prueba"
          icon="i-lucide-send"
          :loading="testBusy"
          :disabled="testBusy"
          @click="sendTestNotification"
        />
        <UButton
          label="Marcar todas como leídas"
          icon="i-lucide-check-check"
          color="neutral"
          variant="outline"
          :loading="actionBusy"
          @click="readAll"
        />
        <p class="text-sm text-muted">
          Envía un aviso a tus dispositivos registrados, sin necesitar ESP32.
        </p>
        <UAlert v-if="testResult" color="success" :title="testResult" />
        <UAlert v-if="testError" color="error" :title="testError" />
      </div>
      <p class="text-muted">
        {{ module.description }}
      </p>
      <UAlert
        v-if="module.notice"
        color="warning"
        variant="soft"
        icon="i-lucide-info"
        :description="module.notice"
      />
      <form
        v-if="module.filters.length"
        class="flex flex-wrap items-end gap-3 rounded-xl border border-default p-4"
        @submit.prevent="applyFilters"
      >
        <label
          v-for="filter in module.filters"
          :key="filter.key"
          class="flex flex-col gap-1.5 text-xs text-muted min-w-40"
        >
          {{ filter.label }}
          <input
            v-if="filter.type"
            v-model="filters[filter.key]"
            :type="filter.type"
            class="agro-filter"
            :placeholder="filter.label"
          >
          <select
            v-else
            v-model="filters[filter.key]"
            :aria-label="filter.label"
            class="agro-filter"
          >
            <option value="">Todos</option>
            <template v-if="filter.source"><option
              v-for="option in options[filter.source] ?? []"
              :key="String(option.id)"
              :value="String(option.id)"
            >
              {{ displayValue(option) }}
            </option></template>
            <template v-else><option
              v-for="option in filter.options"
              :key="option"
              :value="option"
            >
              {{
                option === "true"
                  ? "Sí"
                  : option === "false"
                    ? "No"
                    : displayValue(option)
              }}
            </option></template>
          </select>
        </label>
        <UButton
          type="submit"
          label="Aplicar filtros"
          icon="i-lucide-filter"
          :loading="busy"
        />
        <UButton
          label="Limpiar"
          color="neutral"
          variant="ghost"
          @click="
            Object.keys(filters).forEach((key) => (filters[key] = ''));
            applyFilters();
          "
        />
      </form>
      <UAlert
        v-if="optionsError"
        color="error"
        title="No se cargaron las opciones de filtros"
        :description="optionsError"
      >
        <template #actions>
          <UButton
            label="Reintentar"
            color="error"
            variant="outline"
            @click="loadOptions"
          />
        </template>
      </UAlert>
      <UAlert
        v-if="error"
        color="error"
        title="No se pudo cargar el módulo"
        :description="error"
      >
        <template #actions>
          <UButton
            label="Reintentar"
            color="error"
            variant="outline"
            @click="load"
          />
        </template>
      </UAlert>
      <template v-else>
        <p
          v-if="module.key === 'configuracion-alertas' && !filters.parcelaId"
          class="p-8 text-center text-muted"
        >
          Selecciona una parcela y aplica el filtro para consultar sus umbrales.
        </p>
        <AgroTable
          v-else
          :rows="rows"
          :columns="module.columns"
          :busy="busy"
          @select="inspect"
        />
        <div
          class="flex flex-wrap justify-between items-center gap-3 text-sm text-muted"
        >
          <p v-if="!busy">
            {{ total }} registros{{ module.paginated ? " en total" : "" }}
          </p>
          <div
            v-if="module.paginated && total > 0"
            class="flex items-center gap-3"
          >
            <UButton
              aria-label="Página anterior"
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="outline"
              :disabled="page <= 1 || busy"
              @click="changePage(page - 1)"
            />
            <span>Página {{ page }} de {{ pages }}</span>
            <UButton
              aria-label="Página siguiente"
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="outline"
              :disabled="page >= pages || busy"
              @click="changePage(page + 1)"
            />
          </div>
        </div>
      </template>
      <UModal
        v-model:open="detailOpen"
        :title="module.title + ' · Detalle'"
        description="Información del registro seleccionado."
        :ui="{ content: 'sm:max-w-4xl' }"
      >
        <template #body>
          <p
            v-if="detailBusy"
            role="status"
            class="py-8 text-center text-muted"
          >
            Cargando detalle…
          </p>
          <UAlert
            v-if="detailError"
            color="error"
            :description="detailError"
            class="mb-4"
          >
            <template #actions>
              <UButton
                v-if="selected"
                label="Reintentar"
                color="error"
                variant="outline"
                @click="inspect(selected)"
              />
            </template>
          </UAlert>
          <AgroActions
            v-if="selected && !detailBusy"
            :module-key="module.key"
            :endpoint="module.endpoint"
            :record="selected"
            class="mb-5"
            @saved="saved"
          />
          <AgroDetails v-if="detail" :value="detail" />
          <AgroMoistureTrend
            v-if="
              module.key === 'sensores'
                && selected
                && ['humedad_suelo', 'soil_moisture'].includes(
                  String(
                    (selected.tipos_sensor as AgroRecord)?.codigo
                  ).toLowerCase()
                )
            "
            :sensor-id="String(selected.id)"
            class="mt-6"
          />
          <UButton
            v-if="module.key === 'notificaciones' && selected"
            :label="
              selected?.leida ? 'Marcar como no leída' : 'Marcar como leída'
            "
            icon="i-lucide-check"
            :loading="actionBusy"
            class="mt-4"
            @click="markRead"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
