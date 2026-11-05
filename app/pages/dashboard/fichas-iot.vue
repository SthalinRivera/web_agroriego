<script setup lang="ts">
import { errorText } from '~/utils/agro'

definePageMeta({ layout: 'dashboard' })
useSeoMeta({ title: 'Fichas IoT | Agroriego' })
type Cell = string | number | null
interface Table { id: string, title: string, description: string, columns: { key: string, label: string }[], rows: Record<string, Cell>[], total: number, notes: string[] }
const { request } = useApi()
const { $supabase } = useNuxtApp()
const config = useRuntimeConfig()
const titles = [
  ['Registro de lecturas de sensores', 'Humedad del suelo, caudal y temperatura.'],
  ['Control de adquisición y calidad de datos', 'Lecturas recibidas, válidas, faltantes e incidencias.'],
  ['Registro de eventos de riego', 'Fechas, duración, caudal y volumen de riego.'],
  ['Registro de predicciones y evaluación del modelo', 'Humedad observada y predicha; MAE, RMSE y R².'],
  ['Identificación y calibración de sensores', 'Características, códigos, rangos y calibración de los tres tipos de sensores.']
]
const tables = ref<Table[]>(titles.map(([title, description], i) => ({ id: String(i + 1), title: title!, description: description!, columns: [], rows: [], total: 0, notes: [] })))
const busy = ref(false)
const downloading = ref('')
const error = ref('')
const ready = ref(false)
const filterDates = ref(false)
const desde = ref('')
const hasta = ref('')
const applied = ref<Record<string, string>>({})
const period = computed(() => Object.keys(applied.value).length ? 'Periodo filtrado' : 'Todo el historial')
const display = (value: Cell | undefined) => {
  if (value === null || value === undefined || value === '') return 'Sin dato'
  if (typeof value === 'number') return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 4 }).format(value)
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  return value
}
async function load(query: Record<string, string> = {}) {
  busy.value = true
  error.value = ''
  try {
    const result = await request<{ tables: Table[] }>('fichas-iot/automaticas', { query, timeout: 180000 })
    tables.value = result.tables
    applied.value = query
    ready.value = true
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}
async function applyDates() {
  const query: Record<string, string> = {}
  if (desde.value) query.desde = new Date(`${desde.value}T00:00:00-05:00`).toISOString()
  if (hasta.value) query.hasta = new Date(Math.min(Date.now(), new Date(`${hasta.value}T23:59:59.999-05:00`).getTime())).toISOString()
  await load(query)
}
async function resetDates() {
  filterDates.value = false
  desde.value = ''
  hasta.value = ''
  await load()
}
async function download(type: 'pdf' | 'excel', ficha?: string) {
  if (!$supabase) {
    error.value = 'No se pudo acceder a la sesión. Vuelve a iniciar sesión.'
    return
  }
  downloading.value = `${ficha || 'all'}-${type}`
  error.value = ''
  try {
    const { data, error: authError } = await $supabase.auth.getSession()
    if (authError || !data.session) throw new Error('Tu sesión venció. Vuelve a iniciar sesión.')
    const blob = await $fetch<Blob>(`${config.public.apiBase.replace(/\/$/, '')}/fichas-iot/automaticas/${type}`, {
      query: { ...applied.value, ...(ficha ? { ficha } : {}) },
      headers: { Authorization: `Bearer ${data.session.access_token}` }, responseType: 'blob', timeout: 180000, retry: 0
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ficha ? `ficha-${ficha}` : 'cinco-fichas-iot'}.${type === 'pdf' ? 'pdf' : 'xlsx'}`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  } catch (cause) {
    const failure = cause as { statusCode?: number, data?: unknown }
    let detail = failure.data
    if (detail instanceof Blob) {
      try {
        detail = JSON.parse(await detail.text())
      } catch {
        detail = undefined
      }
    }
    const apiMessage = detail && typeof detail === 'object' && 'message' in detail
      ? (detail as { message?: unknown }).message
      : undefined
    if (failure.statusCode === 401 || failure.statusCode === 403) {
      error.value = errorText(cause)
    } else {
      const reason = typeof apiMessage === 'string'
        ? apiMessage
        : Array.isArray(apiMessage) ? apiMessage.join('. ') : ''
      error.value = `No se pudo descargar el ${type === 'pdf' ? 'PDF' : 'Excel'}.${reason ? ` ${reason}` : ' La API no pudo entregar el archivo. Inténtalo nuevamente.'}`
    }
  } finally {
    downloading.value = ''
  }
}
onMounted(() => load())
</script>

<template>
  <UDashboardPanel id="fichas-iot">
    <template #header>
      <UDashboardNavbar title="Fichas IoT">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <AgroThemeToggle />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-semibold">
            Tus cinco fichas, listas para descargar
          </h1>
          <p class="text-muted mt-2">
            Se completan automáticamente con los datos disponibles de tus parcelas. No necesitas ingresar información.
          </p>
        </div>
        <UAlert
          v-if="error"
          color="error"
          title="No se pudo completar la operación"
          :description="error"
        />
        <section class="rounded-xl border border-default bg-elevated/40 p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="font-semibold">
                Descargar las cinco fichas
              </h2><p class="text-sm text-muted">
                {{ period }} · PDF o Excel (.xlsx)
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton
                icon="i-lucide-file-text"
                :loading="downloading === 'all-pdf'"
                :disabled="!!downloading || busy"
                @click="download('pdf')"
              >
                Descargar todo en PDF
              </UButton>
              <UButton
                icon="i-lucide-file-spreadsheet"
                color="neutral"
                variant="outline"
                :loading="downloading === 'all-excel'"
                :disabled="!!downloading || busy"
                @click="download('excel')"
              >
                Descargar todo en Excel
              </UButton>
            </div>
          </div>
          <UButton
            color="neutral"
            variant="link"
            icon="i-lucide-calendar-days"
            @click="filterDates = !filterDates"
          >
            Filtrar por fecha (opcional)
          </UButton>
          <form v-if="filterDates" class="flex flex-wrap items-end gap-3" @submit.prevent="applyDates">
            <UFormField label="Desde">
              <UInput v-model="desde" type="date" />
            </UFormField>
            <UFormField label="Hasta">
              <UInput v-model="hasta" type="date" />
            </UFormField>
            <UButton type="submit" :loading="busy" :disabled="!!downloading">
              Aplicar fechas
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              :disabled="busy || !!downloading"
              @click="resetDates"
            >
              Ver todo
            </UButton>
          </form>
          <p v-if="Object.keys(applied).length" class="text-sm text-muted">
            Desde {{ applied.desde ? display(applied.desde) : 'el inicio' }} hasta {{ applied.hasta ? display(applied.hasta) : 'ahora' }}. <UButton variant="link" :disabled="busy || !!downloading" @click="resetDates">
              Quitar filtro
            </UButton>
          </p>
        </section>
        <p v-if="busy" role="status" class="text-muted">
          Consultando los datos disponibles…
        </p>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <article v-for="table in tables" :key="table.id" class="rounded-xl border border-default p-5 space-y-4">
            <div class="flex items-start gap-3">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{{ table.id }}</span>
              <div>
                <h2 class="font-semibold">
                  {{ table.title }}
                </h2><p class="text-sm text-muted mt-1">
                  {{ table.description }}
                </p>
              </div>
            </div>
            <p class="text-sm text-muted">
              {{ ready ? (table.total ? `${table.total} registros disponibles` : 'Sin datos todavía · ficha preparada para descargar') : 'Ficha preparada · pendiente de consultar datos' }}
            </p>
            <div class="flex gap-2">
              <UButton
                size="sm"
                icon="i-lucide-file-text"
                :loading="downloading === `${table.id}-pdf`"
                :disabled="!!downloading || busy"
                @click="download('pdf', table.id)"
              >
                PDF
              </UButton>
              <UButton
                size="sm"
                icon="i-lucide-file-spreadsheet"
                color="neutral"
                variant="outline"
                :loading="downloading === `${table.id}-excel`"
                :disabled="!!downloading || busy"
                @click="download('excel', table.id)"
              >
                Excel
              </UButton>
            </div>
            <details v-if="ready" class="text-sm">
              <summary class="cursor-pointer text-primary">
                Ver datos y detalles
              </summary>
              <div class="overflow-x-auto mt-3">
                <table v-if="table.rows.length" class="w-full text-left text-xs">
                  <thead>
                    <tr>
                      <th v-for="col in table.columns" :key="col.key" class="p-2 border-b border-default whitespace-nowrap">
                        {{ col.label }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in table.rows" :key="i">
                      <td v-for="col in table.columns" :key="col.key" class="p-2 border-b border-default">
                        {{ display(row[col.key]) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p v-else class="text-muted">
                  Sin registros disponibles. La descarga incluye los encabezados de esta ficha.
                </p>
              </div>
              <p v-if="table.total > table.rows.length" class="text-muted mt-2">
                Vista previa de {{ table.rows.length }} registros. La descarga incluye todos.
              </p>
              <p v-for="note in table.notes" :key="note" class="text-muted mt-2">
                {{ note }}
              </p>
            </details>
          </article>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
