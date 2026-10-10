<template>
  <UModal v-model:open="open" title="Sedes del cliente" :description="`Cliente: ${cliente?.nombres}`">
    <UButton label="Gestionar sedes" icon="i-lucide-map-pin" />

    <template #body>
      <div class="space-y-4">
        <!-- Lista de sedes asociadas -->
        <div v-for="cs in sedesAsociadas" :key="cs.id_cliente_sede" class="flex justify-between items-center border-b pb-2">
          <div>
            <p class="font-medium">{{ cs.sedes?.nombre }}</p>
            <p class="text-xs text-muted">Relación: {{ cs.tipo_relacion }}</p>
          </div>
          <UButton color="error" variant="ghost" icon="i-lucide-trash" @click="removeSede(cs.id_sede)" />
        </div>
        <div v-if="sedesAsociadas.length === 0" class="text-center text-muted">No hay sedes asociadas</div>

        <!-- Formulario para agregar nueva sede -->
        <UForm :schema="addSedeSchema" :state="addSedeState" @submit="onAddSede" class="pt-4 border-t">
          <UFormField label="Sede" name="id_sede">
            <USelect v-model="addSedeState.id_sede" :items="sedesDisponibles" value-attribute="id" label-attribute="nombre" placeholder="Seleccionar sede" />
          </UFormField>
          <UFormField label="Tipo relación" name="tipo_relacion">
            <UInput v-model="addSedeState.tipo_relacion" placeholder="ej. envío, recolección" />
          </UFormField>
          <div class="flex justify-end pt-2">
            <UButton type="submit" label="Agregar" color="primary" :loading="adding" />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Cliente, ClienteSede, Sede } from '~/types/cliente'

const props = defineProps<{ cliente: Cliente | null }>()
const { getSedes, associateSede } = useClientes()
const { sedes, fetchSedes } = useSedes()
const toast = useToast()

const open = ref(false)
const sedesAsociadas = ref<ClienteSede[]>([])
const adding = ref(false)

const addSedeSchema = z.object({
  id_sede: z.number({ required_error: 'Seleccione una sede' }),
  tipo_relacion: z.string().min(1, 'Ingrese el tipo de relación')
})
type AddSedeSchema = z.output<typeof addSedeSchema>
const addSedeState = reactive<AddSedeSchema>({ id_sede: 0, tipo_relacion: '' })

const sedesDisponibles = computed(() => {
  const idsAsociadas = sedesAsociadas.value.map(cs => cs.id_sede)
  return sedes.value.filter(s => !idsAsociadas.includes(s.id_sede))
})

async function loadSedes() {
  if (!props.cliente) return
  const data = await getSedes(props.cliente.id_cliente)
  sedesAsociadas.value = data
}

async function onAddSede(event: Event & { data: AddSedeSchema }) {
  adding.value = true
  try {
    await associateSede(props.cliente!.id_cliente, event.data.id_sede, event.data.tipo_relacion)
    toast.add({ title: 'Sede asociada', color: 'success' })
    await loadSedes()
    addSedeState.id_sede = 0
    addSedeState.tipo_relacion = ''
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } finally {
    adding.value = false
  }
}

watch(open, async (val) => {
  if (val && props.cliente) {
    await Promise.all([fetchSedes(), loadSedes()])
  }
})
</script>