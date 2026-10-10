<template>
  <UModal
    v-model:open="open"
    :title="`Eliminar usuario`"
    description="¿Estás seguro? Esta acción no se puede deshacer."
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Eliminar"
          color="error"
          variant="solid"
          loading-auto
          @click="onDelete"
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  usuarioId: number
  usuarioEmail: string
}>()

const emit = defineEmits<{
  deleted: []
}>()

const { remove } = useUsuarios()
const toast = useToast()
const open = ref(false)

async function onDelete() {
  try {
    await remove(props.usuarioId)
    toast.add({ title: 'Usuario eliminado', color: 'success' })
    emit('deleted')
    open.value = false
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}
</script>