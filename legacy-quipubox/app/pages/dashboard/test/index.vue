<template>
  <UDashboardPanel>
     <template #header>
      <UDashboardNavbar title="Usuarios">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton label="Nuevo Usuario" icon="i-lucide-plus" @click="openCreateModal" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div>
        <UCard>
        <form @submit.prevent="enviar" class="space-y-4">
          <!-- Campos igual que antes -->
          <UFormField label="Archivo (imagen)">
            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </UFormField>

          <UFormField label="Tipo de entidad">
            <USelect
              v-model="form.tipo_entidad"
              :items="['operacion', 'guia', 'reclamo', 'usuario']"
              placeholder="Selecciona tipo"
            />
          </UFormField>

          <UFormField label="ID de entidad">
            <UInput v-model.number="form.id_entidad" type="number" placeholder="Ej: 25" />
          </UFormField>

          <UFormField label="Descripción">
            <UTextarea v-model="form.descripcion" rows="2" />
          </UFormField>

          <UFormField label="Observaciones">
            <UTextarea v-model="form.observaciones" rows="2" />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton type="submit" color="primary" :loading="loading">
              Subir a Cloudflare R2
            </UButton>
          </div>
        </form>

        <!-- Respuesta exitosa -->
        <div v-if="resultado" class="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-md">
          <p class="font-medium text-green-800 dark:text-green-200">✅ Subida exitosa</p>
          <pre class="text-sm mt-2 overflow-auto">{{ resultado }}</pre>
          <UButton @click="copyToClipboard(resultado.url_archivo)" variant="outline" size="xs" class="mt-2">
            Copiar URL
          </UButton>
        </div>

        <div v-if="errorMsg" class="mt-4 text-red-600">{{ errorMsg }}</div>

        <!-- Listado de evidencias existentes -->
        <div v-if="evidenciasList.length" class="mt-8">
          <h2 class="text-lg font-semibold mb-3">
            🖼️ Evidencias de {{ form.tipo_entidad }} ID {{ form.id_entidad }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="ev in evidenciasList" :key="ev.id_evidencia" class="border rounded-lg p-3">
              <img 
                v-if="ev.url_archivo && (ev.url_archivo.endsWith('.jpg') || ev.url_archivo.endsWith('.png') || ev.url_archivo.endsWith('.jpeg'))" 
                :src="ev.url_archivo" 
                class="w-full h-32 object-cover rounded"
              />
              <div v-else class="w-full h-32 bg-gray-100 flex items-center justify-center">
                <UIcon name="i-lucide-file-text" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ ev.descripcion || 'Sin descripción' }}</p>
              <p class="text-xs text-gray-400">Subido: {{ new Date(ev.fecha_subida).toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </UCard>
      </div>
      
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi';

definePageMeta({
  layout: 'dashboard',
});

const { fetchWithAuth } = useApi();
const file = ref<File | null>(null);
const form = reactive({
  tipo_entidad: 'operacion',
  id_entidad: null as number | null,
  descripcion: '',
  observaciones: '',
});
const loading = ref(false);
const resultado = ref<any>(null);
const errorMsg = ref('');
const evidenciasList = ref<any[]>([]);

// Cargar evidencias existentes para esta entidad
async function cargarEvidencias() {
  if (!form.tipo_entidad || !form.id_entidad) return;
  try {
    const res = await fetchWithAuth(`evidencias/entity?tipo=${form.tipo_entidad}&idEntidad=${form.id_entidad}`);
    evidenciasList.value = res as any[];
  } catch (err) {
    console.error('Error al cargar evidencias:', err);
  }
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  file.value = target.files?.[0] || null;
}

async function enviar() {
  if (!file.value) {
    errorMsg.value = 'Debes seleccionar un archivo';
    return;
  }
  if (!form.tipo_entidad || !form.id_entidad) {
    errorMsg.value = 'Tipo de entidad e ID son obligatorios';
    return;
  }

  loading.value = true;
  errorMsg.value = '';
  resultado.value = null;

  const fd = new FormData();
  fd.append('file', file.value);
  fd.append('tipo_entidad', form.tipo_entidad);
  fd.append('id_entidad', String(form.id_entidad));
  if (form.descripcion) fd.append('descripcion', form.descripcion);
  if (form.observaciones) fd.append('observaciones', form.observaciones);

  try {
    const res = await fetchWithAuth('evidencias/upload', {
      method: 'POST',
      body: fd,
    });
    resultado.value = res;
    // Limpiar input file
    file.value = null;
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.value = '';
    // Recargar lista
    await cargarEvidencias();
  } catch (err: any) {
    console.error('Error detallado:', err);
    errorMsg.value = err.message || 'Error al subir la evidencia';
  } finally {
    loading.value = false;
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  alert('URL copiada al portapapeles');
}

// Cuando cambie el tipo o ID, buscar sus evidencias
watch([() => form.id_entidad, () => form.tipo_entidad], async () => {
  if (form.id_entidad && form.tipo_entidad) {
    await cargarEvidencias();
  }
}, { immediate: true });
</script>