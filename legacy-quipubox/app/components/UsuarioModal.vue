<template>
  <UModal v-model:open="open" :title="modalTitle" :description="modalDesc">
    <UButton :label="triggerLabel" :icon="triggerIcon" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nombres" name="nombres" required>
          <UInput v-model="state.nombres" placeholder="Ej: Juan" />
        </UFormField>

        <UFormField label="Apellidos" name="apellidos">
          <UInput v-model="state.apellidos" placeholder="Ej: Pérez" />
        </UFormField>

        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="usuario@ejemplo.com" />
        </UFormField>

        <UFormField label="Teléfono" name="telefono">
          <UInput v-model="state.telefono" placeholder="9XXXXXXXX" />
        </UFormField>


        <UFormField label="Avatar URL" name="avatar_url">
          <UInput v-model="state.avatar_url" placeholder="https://..." />
        </UFormField>

        <UFormField label="Estado acceso" name="estado_acceso">
          <USelect
            v-model="state.estado_acceso"
            :items="[
              { label: 'Activo', value: 'activo' },
              { label: 'Bloqueado', value: 'bloqueado' }
            ]"
            value-attribute="value"
            label-attribute="label"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton label="Cancelar" color="neutral" variant="subtle" @click="open = false" />
          <UButton
            type="submit"
            :label="isEditing ? 'Actualizar' : 'Crear'"
            color="primary"
            variant="solid"
            :loading="submitting"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Usuario } from '~/types/usuario'

const props = defineProps<{
  editingUser?: Usuario | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const { create, update } = useUsuarios()
const { roles, fetchRoles } = useRoles()
const toast = useToast()

const open = ref(false)
const submitting = ref(false)

// Esquema: id_rol es opcional (number o undefined)
const schema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().optional(),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  avatar_url: z.string().url('URL inválida').optional().or(z.literal('')),
  estado_acceso: z.enum(['activo', 'bloqueado'])
})

type Schema = z.output<typeof schema>

// Estado inicial: id_rol = undefined
const state = reactive<Partial<Schema>>({
  nombres: '',
  apellidos: '',
  email: '',
  telefono: '',
  avatar_url: '',
  estado_acceso: 'activo'
})

const isEditing = computed(() => !!props.editingUser)
const modalTitle = computed(() => (isEditing.value ? 'Editar usuario' : 'Nuevo usuario'))
const modalDesc = computed(() =>
  isEditing.value ? 'Modifica los datos del usuario' : 'Completa la información para crear un nuevo usuario'
)
const triggerLabel = computed(() => (isEditing.value ? 'Editar' : 'Nuevo usuario'))
const triggerIcon = computed(() => (isEditing.value ? 'i-lucide-edit' : 'i-lucide-plus'))

// Opciones para el select de roles: { label, value }
const rolesOptions = computed(() =>
  roles.value.map((r) => ({
    label: r.nombre,
    value: r.id_rol_usuario
  }))
)

// Precargar datos si es edición
watch(
  () => props.editingUser,
  (user) => {
    if (user) {
      state.nombres = user.nombres
      state.apellidos = user.apellidos || ''
      state.email = user.email
      state.telefono = user.telefono || ''
      state.avatar_url = user.avatar_url || ''
      state.estado_acceso = user.estado_acceso
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function resetForm() {
  state.nombres = ''
  state.apellidos = ''
  state.email = ''
  state.telefono = ''
  state.avatar_url = ''
  state.estado_acceso = 'activo'
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    // Construir payload: si id_rol es undefined, no lo enviamos
    const payload: any = {
      nombres: event.data.nombres,
      apellidos: event.data.apellidos,
      email: event.data.email,
      telefono: event.data.telefono,
      avatar_url: event.data.avatar_url,
      estado_acceso: event.data.estado_acceso,
      id_empresa: 1, // TODO: obtener del usuario logueado
      estado: true
    }
    console.log("Este datos  supuestamente se va agregar",payload);
    
    if (event.data.id_rol !== undefined) {
      payload.id_rol = event.data.id_rol
    }
    console.log("este es el rol",event.data.id_rol);
    if (isEditing.value && props.editingUser) {
      await update(props.editingUser.id_usuario, payload)
      toast.add({ title: 'Usuario actualizado', color: 'success' })
    } else {
      await create(payload)
      toast.add({ title: 'Usuario creado', color: 'success' })
    }
     console.log("paso esto");
    emit('saved')
    open.value = false
    resetForm()
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchRoles()
})
</script>