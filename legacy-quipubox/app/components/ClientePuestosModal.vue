<template>
  <UModal v-model:open="open" title="Puestos del cliente" :description="`Cliente: ${cliente?.nombres}`">
    <UButton label="Gestionar puestos" icon="i-lucide-badge" />

    <template #body>
      <div class="space-y-4">
        <div v-for="puesto in puestosAsociados" :key="puesto.id_puesto" class="flex justify-between items-center border-b pb-2">
          <div>
            <p class="font-medium">{{ puesto.numero_puesto }}</p>
            <p class="text-xs text-muted">{{ puesto.referencia }}</p>
          </div>
          <UButton color="error" variant="ghost" icon="i-lucide-trash" @click="removePuesto(puesto.id_puesto)" />
        </div>
        <div v-if="puestosAsociados.length === 0" class="text-center text-muted">No hay puestos asignados</div>

        <UForm :schema="addPuestoSchema" :state="addPuestoState" @submit="onAddPuesto" class="pt-4 border-t">
          <UFormField label="Puesto" name="id_puesto">
            <USelect v-model="addPuestoState.id_puesto" :items="puestosDisponibles" value-attribute="id" label-attribute="label" placeholder="Seleccionar puesto" />
          </UFormField>
          <div class="flex justify-end pt-2">
            <UButton type="submit" label="Asignar" color="primary" :loading="adding" />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Cliente, Puesto } from '~/types/cliente'

const props = defineProps<{ cliente: Cliente | null }>()
const { getPuestos, assignPuesto, removePuesto } = useClientes()
const { puestos, fetchPuestos } = usePuestos()
const toast = useToast()

const open = ref(false)
const puestosAsociados = ref<Puesto[]>([])
const adding = ref(false)

const addPuestoSchema = z.object({
  id_puesto: z.number({ required_error: 'Seleccione un puesto' })
})
type AddPuestoSchema = z.output<typeof addPuestoSchema>
const addPuestoState = reactive<AddPuestoSchema>({ id_puesto: 0 })

const puestosDisponibles = computed(() => {
  const idsAsociados = puestosAsociados.value.map(p => p.id_puesto)
  return puestos.value
    .filter(p => !idsAsociados.includes(p.id_puesto))
    .map(p => ({ id: p.id_puesto, label: `${p.numero_puesto} - ${p.referencia || 'Sin referencia'}` }))
})

async function loadPuestos() {
  if (!props.cliente) return
  const data = await getPuestos(props.cliente.id_cliente)
  puestosAsociados.value = data
}

async function onAddPuesto(event: Event & { data: AddPuestoSchema }) {
  adding.value = true
  try {
    await assignPuesto(props.cliente!.id_cliente, event.data.id_puesto)
    toast.add({ title: 'Puesto asignado', color: 'success' })
    await loadPuestos()
    addPuestoState.id_puesto = 0
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    adding.value = false
  }
}

async function handleRemovePuesto(puestoId: number) {
  try {
    await removePuesto(props.cliente!.id_cliente, puestoId)
    toast.add({ title: 'Puesto removido', color: 'success' })
    await loadPuestos()
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
}

watch(open, async (val) => {
  if (val && props.cliente) {
    await Promise.all([fetchPuestos(), loadPuestos()])
  }
})
</script>