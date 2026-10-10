<template>
  <UModal v-model:open="open" :title="modalTitle" :description="modalDesc">
    <UButton :label="triggerLabel" :icon="triggerIcon" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nombre" name="nombre" required>
          <UInput v-model="state.nombre" placeholder="Ej: Manzana" />
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
import type { Fruta } from '~/types/fruta';

const props = defineProps<{ editingFruta?: Fruta | null }>();
const emit = defineEmits<{ saved: [] }>();

const { create, update } = useFrutas();
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

const isEditing = computed(() => !!props.editingFruta);
const modalTitle = computed(() => (isEditing.value ? 'Editar fruta' : 'Nueva fruta'));
const modalDesc = computed(() =>
  isEditing.value ? 'Modifica los datos de la fruta' : 'Completa la información para crear una nueva fruta'
);
const triggerLabel = computed(() => (isEditing.value ? 'Editar' : 'Nueva fruta'));
const triggerIcon = computed(() => (isEditing.value ? 'i-lucide-edit' : 'i-lucide-plus'));

watch(
  () => props.editingFruta,
  (fruta) => {
    if (fruta) {
      state.nombre = fruta.nombre;
      state.descripcion = fruta.descripcion || '';
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
    if (isEditing.value && props.editingFruta) {
      await update(props.editingFruta.id_fruta, payload);
      toast.add({ title: 'Fruta actualizada', color: 'success' });
    } else {
      await create(payload);
      toast.add({ title: 'Fruta creada', color: 'success' });
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