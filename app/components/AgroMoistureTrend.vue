<script setup lang="ts">
import type { AgroRecord } from '~/types/agro'
import { displayValue, errorText, valueAt } from '~/utils/agro'

const props = defineProps<{ sensorId?: string }>()
const { request, all } = useApi()
const sensors = ref<AgroRecord[]>([])
const sensor = ref(props.sensorId ?? '')
const days = ref('7')
const data = ref<{ recorded_at: string, valor: number }[]>([])
const loading = ref(false)
const error = ref('')
let generation = 0
const points = computed(() => {
  if (!data.value.length) return []
  const start = Date.parse(data.value[0]!.recorded_at)
  const end = Date.parse(data.value[data.value.length - 1]!.recorded_at)
  return data.value.map(item => ({
    ...item,
    x:
      end === start
        ? 400
        : 50 + ((Date.parse(item.recorded_at) - start) / (end - start)) * 710,
    y: 205 - Math.max(0, Math.min(100, item.valor)) * 1.75
  }))
})
const line = computed(() =>
  points.value
    .map((point, index) => {
      const previous = points.value[index - 1]
      const gap
        = previous
          && Date.parse(point.recorded_at) - Date.parse(previous.recorded_at)
          > (days.value === '7' ? 7200000 : 172800000)
      return `${index === 0 || gap ? 'M' : 'L'}${point.x},${point.y}`
    })
    .join(' ')
)
async function load() {
  const current = ++generation
  data.value = []
  error.value = ''
  if (!sensor.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const result = await request<{ data: typeof data.value }>(
      'lecturas/tendencia-humedad',
      { query: { sensorId: sensor.value, days: Number(days.value) } }
    )
    if (current === generation) data.value = result.data
  } catch (cause) {
    if (current === generation) error.value = errorText(cause)
  } finally {
    if (current === generation) loading.value = false
  }
}
async function initialize() {
  if (!props.sensorId) {
    try {
      sensors.value = (await all('sensores')).filter(row =>
        ['humedad_suelo', 'soil_moisture'].includes(
          String(valueAt(row, 'tipos_sensor.codigo')).toLowerCase()
        )
      )
      sensor.value = String(sensors.value[0]?.id ?? '')
    } catch (cause) {
      error.value = errorText(cause)
      return
    }
  }
  await load()
}
watch([sensor, days], () => {
  void load()
})
onMounted(initialize)
onBeforeUnmount(() => generation++)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">
            Humedad del suelo
          </h2>
          <p class="text-xs text-muted">
            Promedios {{ days === "7" ? "por hora" : "por día" }} · Hora de Lima
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <select
            v-if="!sensorId"
            v-model="sensor"
            aria-label="Sensor de humedad"
            class="agro-filter max-w-64"
          >
            <option value="">
              Selecciona un sensor
            </option>
            <option
              v-for="item in sensors"
              :key="String(item.id)"
              :value="String(item.id)"
            >
              {{ displayValue(item) }}
            </option>
          </select>
          <select
            v-model="days"
            aria-label="Periodo de humedad"
            class="agro-filter"
          >
            <option value="7">
              7 días
            </option>
            <option value="30">
              30 días
            </option>
            <option value="365">
              1 año
            </option>
          </select>
        </div>
      </div>
    </template>
    <p v-if="loading" role="status" class="py-16 text-center text-muted">
      Cargando tendencia…
    </p>
    <div v-else-if="error" role="alert" class="py-8 text-center">
      <p class="text-error mb-3">
        {{ error }}
      </p>
      <UButton
        label="Reintentar"
        color="neutral"
        variant="outline"
        @click="initialize"
      />
    </div>
    <p v-else-if="!data.length" class="py-16 text-center text-muted">
      {{
        sensor
          ? "No hay lecturas de humedad en este periodo."
          : "No hay un sensor de humedad seleccionado."
      }}
    </p>
    <template v-else>
      <svg
        viewBox="0 0 800 250"
        class="w-full min-h-48"
        role="img"
        aria-label="Tendencia de humedad del suelo, escala de cero a cien por ciento"
      >
        <g v-for="tick in [0, 25, 50, 75, 100]" :key="tick">
          <line
            x1="50"
            x2="760"
            :y1="205 - tick * 1.75"
            :y2="205 - tick * 1.75"
            stroke="currentColor"
            opacity=".1"
          />
          <text
            x="5"
            :y="210 - tick * 1.75"
            fill="currentColor"
            font-size="12"
          >
            {{ tick }}%
          </text>
        </g>
        <path
          :d="line"
          fill="none"
          stroke="#16a34a"
          stroke-width="2.5"
        />
        <circle
          v-for="point in points"
          :key="point.recorded_at"
          :cx="point.x"
          :cy="point.y"
          r="2.5"
          fill="#16a34a"
        >
          <title>
            {{ displayValue(point.recorded_at) }}:
            {{ displayValue(point.valor) }}%
          </title>
        </circle>
      </svg>
      <div class="flex justify-between gap-4 text-xs text-muted">
        <span>{{ displayValue(data[0]?.recorded_at) }}</span><span>{{ displayValue(data[data.length - 1]?.recorded_at) }}</span>
      </div>
      <details class="mt-4 text-xs">
        <summary class="cursor-pointer text-muted">
          Ver {{ data.length }} puntos de la serie
        </summary>
        <div class="max-h-56 overflow-auto mt-3">
          <p v-for="point in data" :key="point.recorded_at" class="py-1">
            {{ displayValue(point.recorded_at) }} —
            {{ displayValue(point.valor) }}%
          </p>
        </div>
      </details>
    </template>
  </UCard>
</template>
