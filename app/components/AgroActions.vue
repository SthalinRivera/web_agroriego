<script setup lang="ts">
import type { AgroRecord } from '~/types/agro'
import { formDefinitions, formPayload } from '~/utils/agro-forms'
import { displayValue, errorText } from '~/utils/agro'

const props = defineProps<{
  moduleKey: string
  endpoint: string
  record?: AgroRecord | null
}>()
const emit = defineEmits<{ saved: [] }>()
const { request, all } = useApi()
const toast = useToast()
const open = ref(false)
const mode = ref('create')
const values = ref<AgroRecord>({})
const options = ref<Record<string, AgroRecord[]>>({})
const busy = ref(false)
const loading = ref(false)
const initializationFailed = ref(false)
const error = ref('')
const schema = computed(() => formDefinitions[props.moduleKey])
const fields = computed(() =>
  mode.value === 'create'
    ? (schema.value?.[0] ?? [])
    : mode.value === 'edit'
      ? (schema.value?.[1] ?? [])
      : (formDefinitions[mode.value]?.[0] ?? [])
)
const labels: Record<string, string> = {
  create: 'Nuevo registro',
  edit: 'Editar registro',
  finalizar: 'Finalizar riego',
  cancelar: 'Cancelar riego',
  atender: 'Atender alerta',
  resolver: 'Resolver alerta',
  descartar: 'Descartar alerta',
  calibrar: 'Calibrar sensor',
  activar: 'Activar modelo',
  ia: 'Generar análisis simulado',
  desactivar: 'Desactivar avisos del equipo',
  delete: 'Eliminar registro'
}
const title = computed(() => labels[mode.value] ?? 'Guardar')
const activeRiego = computed(() =>
  ['en_curso', 'pausado'].includes(String(props.record?.estado))
)
const activeAlerta = computed(() =>
  ['activa', 'atendida'].includes(String(props.record?.estado))
)
async function begin(action: string) {
  mode.value = action
  error.value = ''
  values.value = {}
  options.value = {}
  open.value = true
  loading.value = true
  initializationFailed.value = false
  try {
    let record = props.record ?? {}
    if (action === 'edit' && props.moduleKey !== 'configuracion-alertas')
      record = await request<AgroRecord>(
        `${props.endpoint}/${encodeURIComponent(String(record.id))}`
      )
    for (const field of fields.value) {
      const value = action === 'edit' ? record[field.readKey] : undefined
      values.value[field.key]
        = value == null
          ? ''
          : ['json', 'array'].includes(field.type)
              ? JSON.stringify(value, null, 2)
              : field.type === 'date'
                ? String(value).slice(0, 10)
                : value
    }
    await Promise.all(
      [
        ...new Set(
          fields.value.flatMap(field => (field.source ? [field.source] : []))
        )
      ].map(async (source) => {
        options.value[source] = [
          'sensores/tipos',
          'modelos-ia',
          'gestion/roles'
        ].includes(source)
          ? await request<AgroRecord[]>(source)
          : await all(source)
      })
    )
  } catch (cause) {
    initializationFailed.value = true
    error.value = errorText(cause)
  } finally {
    loading.value = false
  }
}
async function save() {
  if (busy.value || loading.value || initializationFailed.value) return
  error.value = ''
  let body: AgroRecord
  try {
    body = formPayload(fields.value, values.value)
  } catch (cause) {
    error.value = (cause as Error).message
    return
  }
  busy.value = true
  try {
    let path = props.endpoint
    let method: 'POST' | 'PUT' | 'DELETE' = 'POST'
    if (mode.value === 'create' && props.moduleKey === 'predicciones')
      path += '/predict'
    else if (
      mode.value !== 'create'
      && !(mode.value === 'edit' && props.moduleKey === 'configuracion-alertas')
    ) {
      path
        += '/'
          + encodeURIComponent(
            String(
              props.moduleKey === 'configuracion-alertas'
                ? props.record?.parcela_id
                : props.record?.id
            )
          )
      method
        = mode.value === 'delete'
          ? 'DELETE'
          : ['calibrar', 'ia'].includes(mode.value)
              ? 'POST'
              : 'PUT'
      if (!['edit', 'delete'].includes(mode.value)) path += '/' + mode.value
    }
    await request(path, { method, body })
    open.value = false
    toast.add({
      title: 'Cambios guardados',
      description: 'La información se actualizó correctamente.',
      color: 'success'
    })
    emit('saved')
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UButton
      v-if="!record && schema?.[0]?.length"
      :label="
        moduleKey === 'predicciones'
          ? 'Generar predicción'
          : moduleKey === 'configuracion-alertas'
            ? 'Configurar umbrales'
            : 'Nuevo registro'
      "
      icon="i-lucide-plus"
      size="sm"
      @click="begin('create')"
    />
    <template v-if="record">
      <UButton
        v-if="moduleKey === 'dispositivos-push' && record.activo"
        label="Desactivar avisos"
        color="warning"
        variant="soft"
        @click="begin('desactivar')"
      />
      <UButton
        v-if="schema?.[1]"
        label="Editar"
        icon="i-lucide-pencil"
        variant="soft"
        @click="begin('edit')"
      />
      <template v-if="moduleKey === 'riegos' && activeRiego">
        <UButton
          label="Finalizar riego"
          icon="i-lucide-check"
          @click="begin('finalizar')"
        />
        <UButton
          label="Cancelar riego"
          color="warning"
          variant="soft"
          @click="begin('cancelar')"
        />
      </template>
      <template v-if="moduleKey === 'alertas' && activeAlerta">
        <UButton
          v-if="record.estado === 'activa'"
          label="Atender alerta"
          @click="begin('atender')"
        />
        <UButton label="Resolver alerta" @click="begin('resolver')" />
        <UButton
          label="Descartar alerta"
          color="neutral"
          variant="outline"
          @click="begin('descartar')"
        />
      </template>
      <UButton
        v-if="moduleKey === 'sensores'"
        label="Calibrar"
        icon="i-lucide-gauge"
        variant="outline"
        @click="begin('calibrar')"
      />
      <UButton
        v-if="moduleKey === 'modelos-ia' && !record.activo"
        label="Activar modelo"
        @click="begin('activar')"
      />
      <UButton
        v-if="moduleKey === 'reportes'"
        label="Generar análisis simulado"
        icon="i-lucide-sparkles"
        @click="begin('ia')"
      />
      <UButton
        v-if="
          [
            'accesos', 'parcelas',
            'cultivos',
            'dispositivos',
            'sensores',
            'reportes',
            'modelos-ia',
            'configuracion-alertas'
          ].includes(moduleKey)
        "
        label="Eliminar"
        icon="i-lucide-trash-2"
        color="error"
        variant="ghost"
        @click="begin('delete')"
      />
    </template>
    <UModal
      v-model:open="open"
      :title="title"
      description="Revisa la información antes de confirmar."
      :dismissible="!busy"
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <template #body>
        <form class="space-y-5" @submit.prevent="save">
          <p v-if="loading" role="status">
            Cargando formulario…
          </p>
          <UAlert v-if="error" color="error" :description="error" /><UButton
            v-if="initializationFailed"
            label="Reintentar carga"
            variant="outline"
            @click="begin(mode)"
          />
          <UAlert
            v-if="mode === 'delete'"
            color="warning"
            title="Esta acción no se puede deshacer"
            description="Se eliminará este registro y los datos relacionados según las reglas del sistema."
          />
          <UAlert
            v-if="mode === 'activar'"
            color="warning"
            description="Este modelo quedará activo y se desactivarán los demás."
          />
          <UAlert
            v-if="moduleKey === 'predicciones' || mode === 'ia'"
            color="warning"
            description="El resultado se genera con la simulación actual del servidor."
          />
          <p
            v-if="!fields.length && mode !== 'delete'"
            class="text-sm text-muted"
          >
            Confirma la acción para {{ displayValue(record) }}.
          </p>
          <fieldset
            :disabled="busy || loading"
            class="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <label
              v-for="field in fields"
              :key="field.key"
              class="flex flex-col gap-1.5 text-sm"
              :class="{
                'sm:col-span-2': ['textarea', 'json', 'array'].includes(
                  field.type
                )
              }"
            >
              <span>{{ field.label }}
                <span v-if="field.required" class="text-error">*</span></span>
              <select
                v-if="field.source || field.options || field.type === 'boolean'"
                v-model="values[field.key]"
                class="agro-filter"
                :required="field.required"
              >
                <option value="">Seleccionar</option>
                <template v-if="field.source"><option
                  v-for="option in options[field.source]"
                  :key="String(option.id)"
                  :value="
                    field.type === 'number'
                      ? Number(option.id)
                      : String(option.id)
                  "
                >
                  {{ displayValue(option) }}
                </option></template>
                <template v-else-if="field.type === 'boolean'"><option :value="true">Sí</option>
                  <option :value="false">No</option></template>
                <template v-else><option
                  v-for="option in field.options"
                  :key="option"
                  :value="option"
                >
                  {{ displayValue(option) }}
                </option></template>
              </select>
              <textarea
                v-else-if="['textarea', 'json', 'array'].includes(field.type)"
                v-model="values[field.key] as string"
                class="agro-filter min-h-24"
                :required="field.required"
                :placeholder="
                  field.type === 'json'
                    ? '{}'
                    : field.type === 'array'
                      ? '[&quot;humedad_suelo&quot;]'
                      : ''
                "
              />
              <input
                v-else
                v-model="values[field.key]"
                :type="field.type"
                class="agro-filter"
                :required="field.required"
                :min="field.min"
                :max="field.max"
                :maxlength="field.maxLength"
                :step="field.step ?? 'any'"
              >
            </label>
          </fieldset>
          <div class="flex justify-end gap-2 border-t border-default pt-4">
            <UButton
              label="Volver"
              color="neutral"
              variant="ghost"
              :disabled="busy"
              @click="open = false"
            />
            <UButton
              type="submit"
              :label="fields.length ? 'Guardar cambios' : 'Confirmar acción'"
              :color="mode === 'delete' ? 'error' : 'primary'"
              :loading="busy"
              :disabled="
                loading || initializationFailed
                  || (!!error
                    && Object.keys(options).length === 0
                    && fields.some((field) => field.source))
              "
            />
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>
