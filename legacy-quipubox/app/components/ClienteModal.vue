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

        <UFormField label="Apodo" name="apodo">
          <UInput v-model="state.apodo" placeholder="Ej: Juanito" />
        </UFormField>

        <UFormField label="Teléfono" name="telefono">
          <UInput v-model="state.telefono" placeholder="9XXXXXXXX" />
        </UFormField>

        <UFormField label="Observaciones" name="observaciones">
          <UTextarea v-model="state.observaciones" />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton label="Cancelar" color="neutral" variant="subtle" @click="open = false" />
          <UButton type="submit" :label="isEditing ? 'Actualizar' : 'Crear'" color="primary" :loading="submitting" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Cliente } from '~/types/cliente'

const props = defineProps<{ editingCliente?: Cliente | null }>()
const emit = defineEmits<{ saved: [] }>()

const { create, update } = useClientes()
const toast = useToast()

const open = ref(false)
const submitting = ref(false)

const schema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().optional(),
  apodo: z.string().optional(),
  telefono: z.string().optional(),
  observaciones: z.string().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  nombres: '',
  apellidos: '',
  apodo: '',
  telefono: '',
  observaciones: ''
})

const isEditing = computed(() => !!props.editingCliente)
const modalTitle = computed(() => isEditing.value ? 'Editar cliente' : 'Nuevo cliente')
const modalDesc = computed(() => isEditing.value ? 'Modifica los datos del cliente' : 'Completa la información para crear un nuevo cliente')
const triggerLabel = computed(() => isEditing.value ? 'Editar' : 'Nuevo cliente')
const triggerIcon = computed(() => isEditing.value ? 'i-lucide-edit' : 'i-lucide-plus')

watch(() => props.editingCliente, (cliente) => {
  if (cliente) {
    state.nombres = cliente.nombres
    state.apellidos = cliente.apellidos || ''
    state.apodo = cliente.apodo || ''
    state.telefono = cliente.telefono || ''
    state.observaciones = cliente.observaciones || ''
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  state.nombres = ''
  state.apellidos = ''
  state.apodo = ''
  state.telefono = ''
  state.observaciones = ''
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true
  try {
    const payload = {
      ...event.data,
      id_empresa: 1, // Obtener de contexto (usuario autenticado)
      estado: true
    }
    if (isEditing.value && props.editingCliente) {
      await update(props.editingCliente.id_cliente, payload)
      toast.add({ title: 'Cliente actualizado', color: 'success' })
    } else {
      await create(payload)
      toast.add({ title: 'Cliente creado', color: 'success' })
    }
    emit('saved')
    open.value = false
    resetForm()
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    submitting.value = false
  }
}
</script>