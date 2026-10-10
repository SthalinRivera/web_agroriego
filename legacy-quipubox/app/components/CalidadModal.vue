<template>
  <UModal v-model:open="open" :title="modalTitle" :description="modalDesc">
    <UButton :label="triggerLabel" :icon="triggerIcon" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nombre" name="nombre" required>
          <UInput v-model="state.nombre" placeholder="Ej: Primera calidad" />
        </UFormField>

        <UFormField label="Descripción" name="descripcion">
          <UTextarea v-model="state.descripcion" />
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
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Calidad } from '~/types/calidad';

const props = defineProps<{ editingCalidad?: Calidad | null }>();
const emit = defineEmits<{ saved: [] }>();

const { create, update } = useCalidades();
const toast = useToast();

const open = ref(false);
const submitting = ref(false);

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  nombre: '',
  descripcion: '',
});

const isEditing = computed(() => !!props.editingCalidad);
const modalTitle = computed(() => (isEditing.value ? 'Editar calidad' : 'Nueva calidad'));
const modalDesc = computed(() =>
  isEditing.value ? 'Modifica los datos de la calidad' : 'Completa la información para crear una nueva calidad'
);
const triggerLabel = computed(() => (isEditing.value ? 'Editar' : 'Nueva calidad'));
const triggerIcon = computed(() => (isEditing.value ? 'i-lucide-edit' : 'i-lucide-plus'));

watch(
  () => props.editingCalidad,
  (calidad) => {
    if (calidad) {
      state.nombre = calidad.nombre;
      state.descripcion = calidad.descripcion || '';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  state.nombre = '';
  state.descripcion = '';
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const payload = {
      ...event.data,
      id_empresa: 1, // Reemplazar con empresa del usuario autenticado
      estado: true,
    };
    if (isEditing.value && props.editingCalidad) {
      await update(props.editingCalidad.id_calidad, payload);
      toast.add({ title: 'Calidad actualizada', color: 'success' });
    } else {
      await create(payload);
      toast.add({ title: 'Calidad creada', color: 'success' });
    }
    emit('saved');
    open.value = false;
    resetForm();
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' });
  } finally {
    submitting.value = false;
  }
}
</script>