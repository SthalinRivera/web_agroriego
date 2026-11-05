<script setup lang="ts">
import type { AgroRecord, PageResult } from '~/types/agro'
import { displayValue, errorText } from '~/utils/agro'

const { request } = useApi()
const { user } = useAuth()
const open = ref(false)
const count = ref(0)
const rows = ref<AgroRecord[]>([])
const busy = ref(false)
const saving = ref(false)
const error = ref('')
const browserEnabled = ref(false)
const browserSupported = ref(false)
let seeded = false
const seen = new Set<string>()
function preferenceKey() {
  return 'agroriego-browser-alerts:' + user.value?.id
}
async function toggleBrowserAlerts() {
  if (browserEnabled.value) {
    browserEnabled.value = false
    localStorage.removeItem(preferenceKey())
    return
  }
  const permission = await Notification.requestPermission()
  browserEnabled.value = permission === 'granted'
  if (browserEnabled.value) localStorage.setItem(preferenceKey(), 'enabled')
  else
    error.value
      = 'Los avisos del navegador no están permitidos. Puedes habilitarlos en los permisos del sitio.'
}
const revision = useState('notification-revision', () => 0)
let timer: ReturnType<typeof setInterval> | undefined
let disposed = false
async function refresh() {
  if (busy.value || !user.value) return
  busy.value = true
  try {
    const [unread, recent] = await Promise.all([
      request<number>('notificaciones/no-leidas/count'),
      request<PageResult>('notificaciones', { query: { page: 1, limit: 8 } })
    ])
    if (disposed) return
    count.value = unread
    rows.value = recent.data
    for (const row of recent.data) {
      const id = String(row.id)
      if (
        seeded
        && !seen.has(id)
        && !row.leida
        && browserEnabled.value
        && Notification.permission === 'granted'
      ) {
        try {
          const notice = new Notification(String(row.titulo), {
            body: String(row.mensaje ?? ''),
            tag: id
          })
          notice.onclick = () => {
            window.focus()
            open.value = true
            notice.close()
          }
        } catch {
          /* The in-app inbox remains available on browsers without desktop notifications. */
        }
      }
      seen.add(id)
    }
    seeded = true
    error.value = ''
  } catch (cause) {
    if (!disposed) error.value = errorText(cause)
  } finally {
    busy.value = false
  }
}
async function read(row?: AgroRecord) {
  if (saving.value) return
  saving.value = true
  try {
    await request(
      row
        ? `notificaciones/${encodeURIComponent(String(row.id))}/leer`
        : 'notificaciones/leer-todas',
      { method: 'PUT', body: row ? { leida: !row.leida } : {} }
    )
    revision.value++
    await refresh()
  } catch (cause) {
    error.value = errorText(cause)
  } finally {
    saving.value = false
  }
}
function onVisible() {
  if (document.visibilityState === 'visible') void refresh()
}
watch(open, (value) => {
  if (value) void refresh()
})
watch(revision, () => {
  void refresh()
})
onMounted(() => {
  browserSupported.value = 'Notification' in window && window.isSecureContext
  browserEnabled.value
    = browserSupported.value
      && Notification.permission === 'granted'
      && localStorage.getItem(preferenceKey()) === 'enabled'
  void refresh()
  timer = setInterval(onVisible, 30000)
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  disposed = true
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<template>
  <UButton
    icon="i-lucide-bell"
    color="neutral"
    variant="soft"
    :aria-label="`Abrir notificaciones: ${count} sin leer`"
    class="relative shrink-0"
    @click="open = true"
  >
    <span
      v-if="count"
      class="rounded-full bg-error text-white px-1.5 text-[10px] font-bold"
    >{{ count > 99 ? "99+" : count }}</span>
    <span
      v-if="error"
      class="size-2 rounded-full bg-warning"
      aria-label="Sin conexión"
    />
  </UButton>
  <USlideover
    v-model:open="open"
    title="Centro de notificaciones"
    :description="`${count} avisos sin leer · Actualización cada 30 segundos`"
  >
    <template #body>
      <div
        v-if="browserSupported"
        class="rounded-lg border border-default p-3 mb-4"
      >
        <UButton
          :label="
            browserEnabled
              ? 'Desactivar avisos del navegador'
              : 'Activar avisos del navegador'
          "
          icon="i-lucide-monitor"
          color="neutral"
          variant="soft"
          size="sm"
          @click="toggleBrowserAlerts"
        />
        <p class="text-xs text-muted mt-2">
          Avisos cuando esta web está abierta. En segundo plano dependen del
          navegador.
        </p>
      </div>
      <div class="flex items-center justify-between gap-2 mb-5">
        <UButton
          label="Leer todas"
          icon="i-lucide-check-check"
          size="sm"
          :disabled="!count"
          :loading="saving"
          @click="read()"
        />
        <UButton
          aria-label="Actualizar notificaciones"
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          :loading="busy"
          @click="refresh"
        />
      </div>
      <UAlert
        v-if="error"
        color="error"
        :description="error"
        class="mb-4"
      />
      <p v-if="busy && !rows.length" role="status">
        Cargando notificaciones…
      </p>
      <div
        v-else-if="!rows.length && !error"
        class="text-center py-16 text-muted"
      >
        <UIcon name="i-lucide-bell-off" class="size-10 mb-3" />
        <p>No tienes notificaciones.</p>
      </div>
      <article
        v-for="row in rows"
        :key="String(row.id)"
        class="rounded-xl border border-default p-4 mb-3"
        :class="{ 'bg-primary/5 border-primary/25': !row.leida }"
      >
        <div class="flex gap-2 items-start justify-between">
          <h3 class="font-semibold text-sm">
            {{ row.titulo }}
          </h3>
          <UBadge v-if="!row.leida" size="xs" variant="soft">
            Nueva
          </UBadge>
        </div>
        <p class="text-sm text-muted mt-2">
          {{ row.mensaje }}
        </p>
        <div class="flex justify-between items-center gap-2 mt-3">
          <time class="text-xs text-muted">{{
            displayValue(row.created_at)
          }}</time>
          <UButton
            :label="row.leida ? 'Marcar pendiente' : 'Marcar leída'"
            variant="ghost"
            size="xs"
            :disabled="saving"
            @click="read(row)"
          />
        </div>
      </article>
    </template>
    <template #footer>
      <UButton
        to="/dashboard/notificaciones"
        label="Ver todas las notificaciones"
        block
        @click="open = false"
      />
    </template>
  </USlideover>
</template>
