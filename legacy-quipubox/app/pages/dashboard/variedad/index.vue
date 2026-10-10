<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel } from '@tanstack/table-core'
import type { Row } from '@tanstack/table-core'
import type { Variedad } from '~/types/variedad'
import type { Fruta } from '~/types/fruta'
definePageMeta({ layout: 'dashboard' })
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const table = useTemplateRef('table')

// Estado de la tabla
const columnFilters = ref([
  { id: 'nombre', value: '' },
  { id: 'id_fruta', value: undefined }
])
const columnVisibility = ref()
const rowSelection = ref({})
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
})

// Cargar variedades y frutas con autenticación
const { fetchWithAuth } = useApi()
const { data: variedades, status, refresh: refreshVariedades } = await useAsyncData('variedades', () => fetchWithAuth<Variedad[]>('variedades'), {
  lazy: true,
  default: () => []
})
const { data: frutas, refresh: refreshFrutas } = await useAsyncData('frutas', () => fetchWithAuth<Fruta[]>('frutas'), {
  lazy: true,
  default: () => []
})

// Refrescar ambos
async function refresh() {
  await Promise.all([refreshVariedades(), refreshFrutas()])
}

// Acciones por fila
function getRowItems(row: Row<Variedad>) {
  const variedad = row.original
  return [
    {
      type: 'label',
      label: 'Acciones'
    },
    {
      label: 'Editar',
      icon: 'i-lucide-edit',
      onSelect() {
        openEditModal(variedad)
      }
    },
    {
      type: 'separator'
    },
    {
      label: variedad.estado ? 'Desactivar' : 'Activar',
      icon: variedad.estado ? 'i-lucide-trash' : 'i-lucide-refresh-cw',
      color: variedad.estado ? 'error' : 'success',
      onSelect: async () => {
        if (variedad.estado) {
          try {
            await fetchWithAuth(`variedades/${variedad.id_variedad}`, { method: 'DELETE' })
            toast.add({ title: 'Variedad desactivada', color: 'success' })
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
const columns: TableColumn<Variedad>[] = [
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
    accessorKey: 'id_variedad',
    header: 'ID'
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()
      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Nombre',
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
    accessorKey: 'descripcion',
    header: 'Descripción',
    cell: ({ row }) => row.original.descripcion || '—'
  },
  {
    id: 'fruta_nombre',
    header: 'Fruta',
    accessorKey: 'frutas.nombre', // No es una columna real, usaremos cell
    cell: ({ row }) => row.original.frutas?.nombre || '—'
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

// Filtro por nombre de variedad
const nombreFilter = computed({
  get: () => (table.value?.tableApi?.getColumn('nombre')?.getFilterValue() as string) || '',
  set: (value: string) => {
    table.value?.tableApi?.getColumn('nombre')?.setFilterValue(value || undefined)
  }
})

// Filtro por fruta (basado en id_fruta)
const frutaFilterValue = ref<number | undefined>(undefined)
const frutaOptions = computed(() => {
  if (!frutas.value) return []
  return frutas.value.map(f => ({ label: f.nombre, value: f.id_fruta }))
})

watch(frutaFilterValue, (newVal) => {
  if (!table?.value?.tableApi) return
  const frutaColumn = table.value.tableApi.getColumn('id_fruta')
  if (!frutaColumn) return
  frutaColumn.setFilterValue(newVal)
})

// Eliminación múltiple
const deleteMultiple = async () => {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().rows || []
  if (selectedRows.length === 0) return
  const ids = selectedRows.map(row => row.original.id_variedad)
  for (const id of ids) {
    await fetchWithAuth(`variedades/${id}`, { method: 'DELETE' })
  }
  toast.add({ title: `${ids.length} variedad(es) desactivada(s)`, color: 'success' })
  refresh()
}

// Modales
const editModalOpen = ref(false)
const selectedVariedad = ref<Variedad | null>(null)

function openEditModal(variedad?: Variedad) {
  selectedVariedad.value = variedad || null
  editModalOpen.value = true
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Variedades">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <VariedadModal @saved="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="nombreFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Buscar por nombre..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <!-- Botón de desactivar múltiple -->
          <UButton
            v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
            label="Desactivar seleccionadas"
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
            v-model="frutaFilterValue"
            :items="[{ label: 'Todas las frutas', value: undefined }, ...frutaOptions]"
            placeholder="Filtrar por fruta"
            class="min-w-32"
          />

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
        :data="variedades"
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

  <!-- Modal de edición -->
  <VariedadModal
    v-if="editModalOpen"
    v-model:open="editModalOpen"
    :editing-variedad="selectedVariedad"
    @saved="refresh"
  />
</template>