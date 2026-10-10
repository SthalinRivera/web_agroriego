<template>
  <UModal v-model:open="open" :title="modalTitle" :description="modalDesc">
    <UButton :label="triggerLabel" :icon="triggerIcon" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Nombre" name="nombre" required>
          <UInput v-model="state.nombre" placeholder="Ej: Jaba plástica 20 kg" />
        </UFormField>

        <UFormField label="Tipo de material" name="tipo_material">
          <USelect
            v-model="state.tipo_material"
            :items="materialOptions"
            placeholder="Seleccione un material"
            :clearable="true"
          />
          <p class="text-xs text-muted mt-1">
            Valores permitidos: plástico, madera, metal
          </p>
        </UFormField>

        <UFormField label="Descripción" name="descripcion">
          <UTextarea v-model="state.descripcion" placeholder="Descripción opcional" />
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
import type { TipoJaba } from '~/types/tipoJaba';

const props = defineProps<{ editingTipo?: TipoJaba | null }>();
const emit = defineEmits<{ saved: [] }>();

const { create, update } = useTiposJaba();
const toast = useToast();

const open = ref(false);
const submitting = ref(false);

// Opciones permitidas por la restricción CHECK de la BD
const MATERIALES_VALIDOS = [
  { value: 'plastico', label: 'Plástico' },
  { value: 'madera', label: 'Madera' },
  // Agrega más según la restricción real
] as const;

const materialOptions = computed(() => MATERIALES_VALIDOS);

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  tipo_material: z.string().optional(),
  descripcion: z.string().optional(),
});
type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  nombre: '',
  tipo_material: '',
  descripcion: '',
});

const isEditing = computed(() => !!props.editingTipo);
const modalTitle = computed(() => (isEditing.value ? 'Editar tipo de jaba' : 'Nuevo tipo de jaba'));
const modalDesc = computed(() =>
  isEditing.value ? 'Modifica los datos del tipo de jaba' : 'Completa la información para crear un nuevo tipo de jaba'
);
const triggerLabel = computed(() => (isEditing.value ? 'Editar' : 'Nuevo tipo'));
const triggerIcon = computed(() => (isEditing.value ? 'i-lucide-edit' : 'i-lucide-plus'));

watch(
  () => props.editingTipo,
  (tipo) => {
    if (tipo) {
      state.nombre = tipo.nombre;
      state.tipo_material = tipo.tipo_material || '';
      state.descripcion = tipo.descripcion || '';
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  state.nombre = '';
  state.tipo_material = '';
  state.descripcion = '';
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const payload = {
      ...event.data,
      id_empresa: 1, // Debe venir del usuario autenticado
      estado: true,
    };
    if (isEditing.value && props.editingTipo) {
      await update(props.editingTipo.id_tipo_jaba, payload);
      toast.add({ title: 'Tipo de jaba actualizado', color: 'success' });
    } else {
      await create(payload);
      toast.add({ title: 'Tipo de jaba creado', color: 'success' });
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