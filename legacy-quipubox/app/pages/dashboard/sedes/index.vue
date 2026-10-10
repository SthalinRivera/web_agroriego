<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Sedes">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="Nueva Sede" icon="i-lucide-plus" @click="openCreateModal" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Buscar por nombre o ciudad..."
        />
        <div class="flex gap-2">
          <USelect
            v-model="tipoFilter"
            :items="[
              { label: 'Todos', value: 'all' },
              { label: 'Origen', value: 'origen' },
              { label: 'Destino', value: 'destino' },
              { label: 'Ambos', value: 'ambos' }
            ]"
            placeholder="Filtrar por tipo"
            class="min-w-32"
          />
          <UButton color="neutral" variant="outline" icon="i-lucide-rotate-cw" @click="refresh" />
        </div>
      </div>

      <UTable
        :data="filteredSedes"
        :columns="columns"
        :loading="loading"
        class="shrink-0"
      >
        <!-- Slot para estado -->
        <template #estado-data="{ row }">
          <UBadge :color="row.estado ? 'success' : 'error'">
            {{ row.estado ? 'Activo' : 'Inactivo' }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <UDropdownMenu :items="getRowActions(row)">
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" />
          </UDropdownMenu>
        </template>
      </UTable>

      <div class="flex justify-end mt-4">
        <UPagination
          v-model="page"
          :page-count="pageSize"
          :total="filteredSedes.length"
        />
      </div>
    </template>
  </UDashboardPanel>

  <SedeModal
    v-model="showModal"
    :editing-sede="selectedSede"
    @saved="refresh"
  />
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Sede } from '~/types/sede'
import { useSedes } from '~/composables/useSedes'

definePageMeta({
  layout: 'dashboard'
})

const { sedes, loading, fetchAll, remove } = useSedes()
const search = ref('')
const tipoFilter = ref('all')
const page = ref(1)
const pageSize = 10
const showModal = ref(false)
const selectedSede = ref<Sede | null>(null)

const filteredSedes = computed(() => {
  let filtered = [...sedes.value]
  if (search.value) {
    const term = search.value.toLowerCase()
    filtered = filtered.filter(s => 
      s.nombre.toLowerCase().includes(term) ||
      (s.ciudad && s.ciudad.toLowerCase().includes(term))
    )
  }
  if (tipoFilter.value !== 'all') {
    filtered = filtered.filter(s => s.tipo_sede === tipoFilter.value)
  }
  const start = (page.value - 1) * pageSize
  return filtered.slice(start, start + pageSize)
})

const columns: TableColumn<Sede>[] = [
  { accessorKey: 'id_sede', header: 'ID' },
  { accessorKey: 'nombre', header: 'Nombre' },
  { accessorKey: 'tipo_sede', header: 'Tipo' },
  { accessorKey: 'ciudad', header: 'Ciudad' },
  { accessorKey: 'departamento', header: 'Departamento' },
  { accessorKey: 'telefono', header: 'Teléfono' },
  { accessorKey: 'estado', header: 'Estado' },
  { id: 'actions', header: 'Acciones' }
]

function getRowActions(row: Sede) {
  return [
    {
      label: 'Editar',
      icon: 'i-lucide-edit',
      onSelect: () => {
        selectedSede.value = row
        showModal.value = true
      }
    },
    {
      label: 'Eliminar',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: async () => {
        if (confirm(`¿Eliminar sede ${row.nombre}?`)) {
          await remove(row.id_sede)
        }
      }
    }
  ]
}

function openCreateModal() {
  selectedSede.value = null
  showModal.value = true
}

async function refresh() {
  await fetchAll()
}

onMounted(() => {
  refresh()
})
</script>