<script setup lang="ts">
import { displayValue, labelFor } from '~/utils/agro'

const props = defineProps<{ value: unknown }>()
const entries = computed(() =>
  props.value && typeof props.value === 'object'
    ? Object.entries(props.value).filter(
        ([key]) => !/secret|password|token|encrypted/i.test(key)
      )
    : []
)
const nested = (value: unknown) => value !== null && typeof value === 'object'
</script>

<template>
  <p v-if="value === null || value === undefined" class="text-sm text-muted">
    Sin datos registrados.
  </p>
  <div v-else-if="Array.isArray(value)" class="space-y-3">
    <p v-if="!value.length" class="text-sm text-muted">
      Sin registros.
    </p>
    <details
      v-for="(item, index) in value"
      :key="index"
      class="rounded-lg border border-default p-3"
    >
      <summary class="cursor-pointer text-sm font-medium">
        {{ index + 1 }}. {{ displayValue(item) }}
      </summary>
      <AgroDetails :value="item" class="mt-3" />
    </details>
  </div>
  <dl
    v-else-if="typeof value === 'object'"
    class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
  >
    <div
      v-for="[key, item] in entries"
      :key="key"
      :class="nested(item) ? 'sm:col-span-2' : ''"
      class="min-w-0"
    >
      <template v-if="nested(item)">
        <details class="border border-default rounded-lg p-3">
          <summary class="cursor-pointer font-medium">
            {{ labelFor(key) }}
            <span class="text-muted">{{
              Array.isArray(item) ? "(" + item.length + ")" : ""
            }}</span>
          </summary>
          <AgroDetails :value="item" class="mt-3" />
        </details>
      </template>
      <template v-else>
        <dt class="text-muted text-xs mb-1">
          {{ labelFor(key) }}
        </dt>
        <dd class="break-words whitespace-pre-wrap">
          {{ displayValue(item, Array.isArray(value) ? undefined : key) }}
        </dd>
      </template>
    </div>
  </dl>
  <p v-else class="text-sm break-words">
    {{ displayValue(value) }}
  </p>
</template>
