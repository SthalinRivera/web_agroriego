<script setup lang="ts">
import type { AgroRecord, Column } from '~/types/agro'
import { displayValue, valueAt } from '~/utils/agro'

defineProps<{ rows: AgroRecord[], columns: Column[], busy?: boolean }>()
defineEmits<{ select: [row: AgroRecord] }>()
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-default">
    <table class="w-full text-sm text-left">
      <thead class="bg-elevated/60 text-muted">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            class="p-4 font-medium whitespace-nowrap"
            scope="col"
          >
            {{ column.label }}
          </th>
          <th class="p-4" scope="col">
            <span class="sr-only">Detalle</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-if="busy">
          <td
            :colspan="columns.length + 1"
            class="p-10 text-center text-muted"
            role="status"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="animate-spin mr-2"
            />Cargando datos…
          </td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length + 1" class="p-10 text-center text-muted">
            No hay registros para esta consulta.
          </td>
        </tr>
        <template v-else>
          <tr
            v-for="(row, index) in rows"
            :key="String(row.id ?? index)"
            class="hover:bg-elevated/40"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="p-4 max-w-72 break-words"
            >
              {{ displayValue(valueAt(row, column.key), column.key) }}
            </td>
            <td class="p-4">
              <UButton
                label="Ver detalle"
                icon="i-lucide-arrow-up-right"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="$emit('select', row)"
              />
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
