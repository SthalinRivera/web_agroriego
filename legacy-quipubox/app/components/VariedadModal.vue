<template>
  <UModal v-model:open="open" :title="modalTitle" :description="modalDesc">
    <UButton :label="triggerLabel" :icon="triggerIcon" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Fruta" name="id_fruta" required>
          <USelect
            v-model="state.id_fruta"
            :items="frutasOptions"
            placeholder="Seleccionar fruta"
          />
        </UFormField>

        <UFormField label="Nombre" name="nombre" required>
          <UInput v-model="state.nombre" placeholder="Ej: Fuji" />
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
import type { Variedad } from '~/types/variedad';
import { useFrutas } from '~/composables/useFrutas';

const props = defineProps<{ editingVariedad?: Variedad | null }>();
const emit = defineEmits<{ saved: [] }>();

const { create, update } = useVariedades();
const { frutas, fetchAll: fetchFrutas } = useFrutas();
const toast = useToast();

const open = ref(false);
const submitting = ref(false);

const schema = z.object({
  id_fruta: z.number({ required_error: 'Seleccione una fruta' }),
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional(),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  id_fruta: undefined,
  nombre: '',
  descripcion: '',
});

const isEditing = computed(() => !!props.editingVariedad);
const modalTitle = computed(() => (isEditing.value ? 'Editar variedad' : 'Nueva variedad'));
const modalDesc = computed(() =>
  isEditing.value ? 'Modifica los datos de la variedad' : 'Completa la información para crear una nueva variedad'
);
const triggerLabel = computed(() => (isEditing.value ? 'Editar' : 'Nueva variedad'));
const triggerIcon = computed(() => (isEditing.value ? 'i-lucide-edit' : 'i-lucide-plus'));

// Opciones para el select: cada objeto con { value, label }
const frutasOptions = computed(() =>
  frutas.value.map(f => ({ value: f.id_fruta, label: f.nombre }))
);

watch(
  () => props.editingVariedad,
  (variedad) => {
    if (variedad) {
      state.id_fruta = variedad.id_fruta;
      state.nombre = variedad.nombre;
      state.descripcion = variedad.descripcion || '';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  state.id_fruta = undefined;
  state.nombre = '';
  state.descripcion = '';
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    // Depuración: ver qué llega
    console.log('Datos enviados:', event.data);

    const payload = {
      ...event.data,
      id_empresa: 1, // Reemplazar con empresa del usuario autenticado
      estado: true,
    };
    if (isEditing.value && props.editingVariedad) {
      await update(props.editingVariedad.id_variedad, payload);
      toast.add({ title: 'Variedad actualizada', color: 'success' });
    } else {
      await create(payload);
      toast.add({ title: 'Variedad creada', color: 'success' });
    }
    emit('saved');
    open.value = false;
    resetForm();
  } catch (error: any) {
    console.error('Error al guardar:', error);
    toast.add({ title: 'Error', description: error.message, color: 'error' });
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  fetchFrutas();
});
</script>