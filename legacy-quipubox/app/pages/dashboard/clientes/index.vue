<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { Cliente } from '~/types/cliente'
definePageMeta({ layout: 'dashboard' })
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

// Estado de la tabla
const columnFilters = ref([
  { id: 'nombres', value: '' },
  { id: 'telefono', value: '' }
])
const columnVisibility = ref()
const rowSelection = ref({})
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// Cargar datos con autenticación
const { fetchWithAuth } = useApi()
const { data, status, refresh } = await useAsyncData('clientes', () => fetchWithAuth<Cliente[]>('clientes'), {
  lazy: true,
  default: () => []
})

// Acciones por fila
function getRowItems(row: Row<Cliente>) {
  const cliente = row.original
  return [
    {
      type: 'label',
      label: 'Acciones'
    },
    {
      label: 'Editar',
      icon: 'i-lucide-edit',
      onSelect() {
        openEditModal(cliente)
      }
    },
    {
      label: 'Gestionar sedes',
      icon: 'i-lucide-map-pin',
      onSelect() {
        openSedesModal(cliente)
      }
    },
    {
      label: 'Gestionar puestos',
      icon: 'i-lucide-badge',
      onSelect() {
        openPuestosModal(cliente)
      }
    },
    {
      type: 'separator'
    },
    {
      label: cliente.estado ? 'Desactivar' : 'Activar',
      icon: cliente.estado ? 'i-lucide-trash' : 'i-lucide-refresh-cw',
      color: cliente.estado ? 'error' : 'success',
      onSelect: async () => {
        if (cliente.estado) {
          try {
            await fetchWithAuth(`clientes/${cliente.id_cliente}`, { method: 'DELETE' })
            toast.add({ title: 'Cliente desactivado', color: 'success' })
            refresh()
          } catch (error: any) {
            toast.add({ title: 'Error', description: error.message, color: 'error' })
          }
        } else {
          toast.add({ title: 'Funcionalidad no implementada', color: 'warning' })
        }
      }
    }
  ]
}

// Columnas
const columns: TableColumn<Cliente>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'id_cliente',
    header: 'ID'
  },
  {
    accessorKey: 'nombres',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Nombres',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  {
    accessorKey: 'apellidos',
    header: 'Apellidos',
    cell: ({ row }) => row.original.apellidos || '—'
  },
  {
    accessorKey: 'telefono',
    header: 'Teléfono',
    cell: ({ row }) => row.original.telefono || '—'
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    filterFn: 'equals',
    cell: ({ row }) => {
      const estado = row.original.estado
      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: estado ? 'success' : 'error'
      }, () => estado ? 'Activo' : 'Inactivo')
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h('div', { class: 'text-right' }, [
        h(UDropdownMenu, {
          content: { align: 'end' },
          items: getRowItems(row)
        }, () => h(UButton, {
          icon: 'i-lucide-ellipsis-vertical',
          color: 'neutral',
          variant: 'ghost',
          class: 'ml-auto'
        }))
      ])
    }
  }
]

// Filtro global por estado
const estadoFilter = ref('all')
watch(() => estadoFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return
  const estadoColumn = table.value.tableApi.getColumn('estado')
  if (!estadoColumn) return
  if (newVal === 'all') {
    estadoColumn.setFilterValue(undefined)
  } else {
    estadoColumn.setFilterValue(newVal === 'activo')
  }
})

// Búsqueda global: actualiza filtros de 'nombres' y 'telefono'
const globalSearch = ref('')
watch(globalSearch, (value) => {
  if (!table?.value?.tableApi) return
  const nombresColumn = table.value.tableApi.getColumn('nombres')
  const telefonoColumn = table.value.tableApi.getColumn('telefono')
  if (nombresColumn) nombresColumn.setFilterValue(value || undefined)
  if (telefonoColumn) telefonoColumn.setFilterValue(value || undefined)
})

// Modales
const editModalOpen = ref(false)
const sedesModalOpen = ref(false)
const puestosModalOpen = ref(false)
const selectedCliente = ref<Cliente | null>(null)

function openEditModal(cliente?: Cliente) {
  selectedCliente.value = cliente || null
  editModalOpen.value = true
}
function openSedesModal(cliente: Cliente) {
  selectedCliente.value = cliente
  sedesModalOpen.value = true
}
function openPuestosModal(cliente: Cliente) {
  selectedCliente.value = cliente
  puestosModalOpen.value = true
}

// Eliminación múltiple
const deleteMultiple = async () => {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (selectedRows.length === 0) return
  const ids = selectedRows.map(row => row.original.id_cliente)
  for (const id of ids) {
    await fetchWithAuth(`clientes/${id}`, { method: 'DELETE' })
  }
  toast.add({ title: `${ids.length} cliente(s) desactivado(s)`, color: 'success' })
  refresh()
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Clientes">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <ClienteModal @saved="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="globalSearch"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Buscar por nombre o teléfono..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <!-- Botón de desactivar múltiple -->
          <UButton
            v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="Desactivar seleccionados"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="deleteMultiple"
          >
            <template #trailing>
              <UKbd>
                {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
              </UKbd>
            </template>
          </UButton>

          <USelect
            v-model="estadoFilter"
            :items="[
              { label: 'Todos', value: 'all' },
              { label: 'Activo', value: 'activo' },
              { label: 'Inactivo', value: 'inactivo' }
            ]"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            placeholder="Filtrar estado"
            class="min-w-28"
          />

          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Columnas"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="data"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} de
          {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} fila(s) seleccionada(s).
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modales -->
  <ClienteModal
    v-if="editModalOpen"
    v-model:open="editModalOpen"
    :editing-cliente="selectedCliente"
    @saved="refresh"
  />

  <ClienteSedesModal
    v-if="sedesModalOpen"
    v-model:open="sedesModalOpen"
    :cliente="selectedCliente"
  />

  <ClientePuestosModal
    v-if="puestosModalOpen"
    v-model:open="puestosModalOpen"
    :cliente="selectedCliente"
  />
</template>