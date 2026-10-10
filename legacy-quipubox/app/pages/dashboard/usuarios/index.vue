<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Usuarios">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UsuarioModal @saved="refresh" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <UInput
          v-model="emailFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Filtrar por email..."
        />

        <div class="flex gap-2">
          <USelect
            v-model="rolFilter"
            :items="[{ label: 'Todos', value: 'all' }, ...rolesOptions]"
            placeholder="Filtrar por rol"
            class="min-w-32"
          />
          <UButton color="neutral" variant="outline" icon="i-lucide-rotate-cw" @click="refresh" />
        </div>
      </div>

      <UTable
        ref="tableRef"
        :data="filteredUsuarios"
        :columns="columns"
        :loading="loading"
        v-model:sorting="sorting"
        v-model:pagination="pagination"
      >
        <!-- Avatar -->
        <template #avatar_url-data="{ row }">
          <UTooltip :text="`${row.nombres} ${row.apellidos || ''}`">
            <UAvatar
              :src="row.avatar_url || undefined"
              :text="getInitials(row.nombres, row.apellidos)"
              size="sm"
            />
          </UTooltip>
        </template>

        <!-- Estado acceso -->
        <template #estado_acceso-data="{ row }">
          <UBadge :color="row.estado_acceso === 'activo' ? 'success' : 'error'">
            {{ row.estado_acceso }}
          </UBadge>
        </template>

        <!-- Rol (personalizado) -->
        <template #rol-data="{ row }">
          <UBadge color="neutral" variant="subtle">
            {{ row.usuarios_roles?.[0]?.roles_usuarios?.nombre || 'Sin rol' }}
          </UBadge>
        </template>

        <!-- Empresa (objeto → mostrar razón social) -->
        <template #empresas-data="{ row }">
          {{ row.empresas?.razon_social || '—' }}
        </template>

        <!-- Sede (objeto → mostrar nombre) -->
        <template #sedes-data="{ row }">
          {{ row.sedes?.nombre || '—' }}
        </template>

        <!-- Acciones -->
        <template #actions-data="{ row }">
          <UDropdownMenu :items="getRowItems(row)">
            <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" />
          </UDropdownMenu>
        </template>
      </UTable>

      <div class="flex justify-end mt-4">
        <UPagination
          :default-page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="filteredUsuarios.length"
          @update:page="(p) => (pagination.pageIndex = p - 1)"
        />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modal de edición -->
  <UsuarioModal
    v-if="selectedUser"
    v-model:open="editModalOpen"
    :editing-user="selectedUser"
    @saved="refresh"
  />

  <!-- Modal de eliminación -->
  <UsuarioDeleteModal
    v-if="userToDelete"
    v-model:open="deleteModalOpen"
    :usuario-id="userToDelete.id_usuario"
    :usuario-email="userToDelete.email"
    @deleted="refresh"
  />
</template>

<script setup lang="ts">
import type { TableColumn, SortingState, PaginationState } from '@tanstack/table-core'
import type { Usuario } from '~/types/usuario'
import { useUsuarios } from '~/composables/useUsuarios'
import { useRoles } from '~/composables/useRoles'

definePageMeta({ layout: 'dashboard' })

const { usuarios, loading, fetchAll, bloquear, activar } = useUsuarios()
const { roles, fetchRoles } = useRoles()
const toast = useToast()

// Filtros
const emailFilter = ref('')
const rolFilter = ref('all')

// Ordenamiento y paginación
const sorting = ref<SortingState>([{ id: 'id_usuario', desc: false }])
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: 10 })

// Modales
const selectedUser = ref<Usuario | null>(null)
const editModalOpen = ref(false)
const userToDelete = ref<Usuario | null>(null)
const deleteModalOpen = ref(false)

// Opciones de rol para el filtro
const rolesOptions = computed(() =>
  roles.value.map(rol => ({ label: rol.nombre, value: rol.id_rol_usuario.toString() }))
)

// Definición de columnas (coinciden con los slots)
const columns: TableColumn<Usuario>[] = [
  { accessorKey: 'id_usuario', header: 'ID' },
  {
    accessorKey: 'avatar_url',
    header: 'Avatar',
    cell: ({ row }) => {
      const u = row.original;
      return h(UTooltip, { text: `${u.nombres} ${u.apellidos || ''}` }, () =>
        h(UAvatar, {
          src: u.avatar_url || undefined,
          text: getInitials(u.nombres, u.apellidos),
          size: 'sm'
        })
      );
    }
  },
  { accessorKey: 'nombres', header: 'Nombres' },
  { accessorKey: 'apellidos', header: 'Apellidos' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'telefono', header: 'Teléfono' },
  {
    accessorKey: 'estado_acceso',
    header: 'Estado',
    cell: ({ row }) => {
      const estado = row.original.estado_acceso;
      return h(UBadge, { color: estado === 'activo' ? 'success' : 'error' }, () => estado);
    }
  },
  {
    id: 'rol',
    header: 'Rol',
    cell: ({ row }) => row.original.usuarios_roles?.[0]?.roles_usuarios?.nombre || 'Sin rol'
  },
  {
    accessorKey: 'empresas',
    header: 'Empresa',
    cell: ({ row }) => row.original.empresas?.razon_social || '—'
  },
  {
    accessorKey: 'sedes',
    header: 'Sede',
    cell: ({ row }) => row.original.sedes?.nombre || '—'
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      return h('div', { class: 'text-right' }, [
        h(UDropdownMenu, {
          items: getRowItems(row.original), // pasa el usuario original
          content: { align: 'end' }
        }, () => h(UButton, { icon: 'i-lucide-more-horizontal', color: 'neutral', variant: 'ghost' }))
      ]);
    }
  }
];

// Usuarios filtrados (búsqueda + rol)
const filteredUsuarios = computed(() => {
  let filtered = [...usuarios.value]
  if (emailFilter.value) {
    const term = emailFilter.value.toLowerCase()
    filtered = filtered.filter(u => u.email.toLowerCase().includes(term))
  }
  if (rolFilter.value !== 'all') {
    const rolId = Number(rolFilter.value)
    filtered = filtered.filter(u =>
      u.usuarios_roles?.some(ur => ur.id_rol_usuario === rolId)
    )
  }
  return filtered
})

// Iniciales para avatar
function getInitials(nombres: string, apellidos?: string | null): string {
  const first = nombres?.charAt(0) || ''
  const last = apellidos?.charAt(0) || ''
  return (first + last).toUpperCase() || '?'
}

// Acciones del menú por fila
function getRowItems(row: Usuario) {
  return [
    {
      label: 'Editar',
      icon: 'i-lucide-edit',
      onSelect: () => {
        selectedUser.value = row
        editModalOpen.value = true
      }
    },
    {
      label: row.estado_acceso === 'activo' ? 'Bloquear' : 'Activar',
      icon: row.estado_acceso === 'activo' ? 'i-lucide-lock' : 'i-lucide-unlock',
      onSelect: async () => {
        if (row.estado_acceso === 'activo') {
          await bloquear(row.id_usuario)
        } else {
          await activar(row.id_usuario)
        }
        toast.add({ title: `Usuario ${row.estado_acceso === 'activo' ? 'bloqueado' : 'activado'}`, color: 'success' })
        await refresh()
      }
    },
    {
      label: 'Eliminar',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        userToDelete.value = row
        deleteModalOpen.value = true
      }
    }
  ]
}

async function refresh() {
  await Promise.all([fetchAll(), fetchRoles()])
}

onMounted(() => {
  refresh()
})
</script>