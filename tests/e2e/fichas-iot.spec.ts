import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter(line => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const at = line.indexOf('=')
      return [
        line.slice(0, at),
        line.slice(at + 1).replace(/^["']|["']$/g, '')
      ]
    })
)
const supabaseUrl = env.NUXT_PUBLIC_SUPABASE_URL!
const apiBase
  = env.NUXT_PUBLIC_API_BASE
    || env.NUXT_PUBLIC_API_BASE_URL
    || 'http://localhost:4000'
const owner = '550e8400-e29b-41d4-a716-446655440000'
const parcelaId = '550e8400-e29b-41d4-a716-446655440001'
const sensorId = '550e8400-e29b-41d4-a716-446655440002'
const deviceId = '550e8400-e29b-41d4-a716-446655440003'
const date = '2026-10-09T15:00:00Z'
const row = {
  id: parcelaId,
  nombre: 'Campo de prueba',
  codigo: 'PAR-01',
  cultivo: 'Palta',
  variedad: 'Hass',
  departamento: 'Lima',
  area_hectareas: 2,
  activa: true,
  activo: true,
  cantidad_plantas: 100,
  parcelas: { id: parcelaId, nombre: 'Campo de prueba' },
  _count: { cultivos: 2, dispositivos: 1 },
  device_uid: 'TEST-ESP32',
  estado: 'activa',
  bateria_porcentaje: 85,
  ultima_conexion: date,
  tipos_sensor: {
    id: 1,
    nombre: 'Humedad del suelo',
    codigo: 'humedad_suelo',
    unidad: '%'
  },
  dispositivos: { id: deviceId, nombre: 'Estación de prueba' },
  sensores: {
    id: sensorId,
    nombre: 'Sensor de prueba',
    tipos_sensor: { unidad: '%' }
  },
  titulo: 'Registro de prueba',
  mensaje: 'Mensaje de prueba',
  prioridad: 'alta',
  leida: false,
  valor: 32.5,
  recorded_at: date,
  created_at: date,
  inicio: date,
  modelos_ia: { nombre: 'Modelo de prueba' },
  version: '1.0',
  algoritmo: 'Reglas',
  humedad_predicha: 40,
  tiempo_riego_horas: 1,
  confianza: 80,
  formato: 'pdf',
  humedad_minima: 20,
  humedad_maxima: 60,
  notificaciones_activas: true
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', error => console.error('PAGE ERROR:', error.message))
  page.on('requestfailed', request =>
    console.error(
      'REQUEST FAILED:',
      new URL(request.url()).pathname,
      request.failure()?.errorText
    )
  )
  page.on('response', (response) => {
    if (response.status() >= 400)
      console.error(
        'HTTP ERROR:',
        response.status(),
        new URL(response.url()).pathname
      )
  })
  const exp = Math.floor(Date.now() / 1000) + 86400
  const accessToken = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
      'base64url'
    ),
    Buffer.from(
      JSON.stringify({ sub: owner, exp, role: 'authenticated' })
    ).toString('base64url'),
    'test-only-signature'
  ].join('.')
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session))
    },
    {
      key: 'sb-' + new URL(supabaseUrl).hostname.split('.')[0] + '-auth-token',
      session: {
        access_token: accessToken,
        refresh_token: 'test-only-refresh',
        expires_at: exp,
        expires_in: 86400,
        token_type: 'bearer',
        user: {
          id: owner,
          email: 'test@example.com',
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {},
          created_at: date
        }
      }
    }
  )
  await page.route(supabaseUrl + '/auth/v1/**', route =>
    route.fulfill({ json: { id: owner, email: 'test@example.com' } })
  )
  await page.route(apiBase.replace(/\/$/, '') + '/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (!route.request().headers().authorization?.startsWith('Bearer ')) {
      await route.fulfill({ status: 401, json: { message: 'Missing token' } })
      return
    }
    if (path === '/auth/profile') {
      await route.fulfill({
        json: {
          id: owner,
          nombres: 'Ana',
          apellidos: 'Prueba',
          email: 'test@example.com',
          estado: true,
          roles: [{ id: 1, nombre: 'Agricultor' }]
        }
      })
      return
    }
    if (path === '/lecturas/tendencia-humedad') {
      await route.fulfill({
        json: {
          data: [
            { recorded_at: date, valor: 32.5 },
            { recorded_at: '2026-10-09T16:00:00Z', valor: 35 }
          ]
        }
      })
      return
    }
    if (path === '/lecturas/latest') {
      await route.fulfill({ json: [row] })
      return
    }
    if (path === '/modelos-ia' || path === '/sensores/tipos') {
      await route.fulfill({ json: [row] })
      return
    }
    if (path.endsWith('/estadisticas')) {
      await route.fulfill({
        json: { count: 2, min: 32.5, max: 35, avg: 33.75, latest: row }
      })
      return
    }
    if (path.startsWith('/parcelas/dashboard/')) {
      await route.fulfill({
        json: {
          parcela: row,
          ultimaLectura: row,
          alertasActivas: [row],
          riegoActual: null
        }
      })
      return
    }
    if (path.endsWith('/metricas')) {
      await route.fulfill({
        json: { modelo: row, evaluaciones: [], resumen: null }
      })
      return
    }
    if (path === '/notificaciones/no-leidas/count') {
      await route.fulfill({ json: 1 })
      return
    }
    if (path === '/alertas/count') {
      await route.fulfill({
        json: { activa: 1, atendida: 0, resuelta: 0, descartada: 0, total: 1 }
      })
      return
    }
    if (path.split('/').length > 2) {
      await route.fulfill({ json: row })
      return
    }
    const number = Number(url.searchParams.get('page') || 1)
    const limit = Number(url.searchParams.get('limit') || 20)
    const data
      = path === '/sensores'
        ? [{ ...row, id: sensorId, nombre: 'Sensor de prueba' }]
        : path === '/dispositivos'
          ? [{ ...row, id: deviceId, nombre: 'Estación de prueba' }]
          : [{ ...row, nombre: number === 2 ? 'Segunda página' : row.nombre }]
    await route.fulfill({
      json: {
        data,
        meta: {
          total: path === '/parcelas' && limit === 20 ? 21 : 1,
          page: number,
          limit,
          totalPages: path === '/parcelas' && limit === 20 ? 2 : 1
        }
      }
    })
  })
})

const titles = ['Registro de lecturas de sensores', 'Control de adquisición y calidad de datos', 'Registro de eventos de riego', 'Registro de predicciones y evaluación del modelo', 'Identificación y calibración de sensores']
test.beforeEach(async ({ page }) => {
  await page.route(apiBase.replace(/\/$/, '') + '/fichas-iot/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/pdf') || url.pathname.endsWith('/excel')) return route.fulfill({ contentType: 'application/octet-stream', body: 'download fixture' })
    return route.fulfill({ json: { tables: titles.map((title, i) => ({ id: String(i + 1), title, description: 'Datos adquiridos automáticamente', columns: [{ key: 'valor', label: 'Valor' }], rows: i === 0 ? [{ valor: 0 }] : [], total: i === 0 ? 42 : 0, notes: ['Sin datos no se calculan métricas.'] })) } })
  })
})
test('five visible fichas and direct downloads without input', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/fichas-iot/automaticas')) requests.push(r.url())
  })
  await page.goto('/dashboard/fichas-iot')
  for (const title of titles) await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  await expect(page.locator('input')).toHaveCount(0)
  await expect(page.getByText('42 registros disponibles')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar todo en Excel', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('cinco-fichas-iot.xlsx')
  expect(requests.every(url => !url.includes('desde=') && !url.includes('hasta='))).toBe(true)
  const individual = page.waitForEvent('download')
  await page.locator('article').nth(4).getByRole('button', { name: 'PDF', exact: true }).click()
  expect((await individual).suggestedFilename()).toBe('ficha-5.pdf')
  expect(requests.some(url => url.includes('ficha=5'))).toBe(true)
  await page.locator('article').first().getByText('Ver datos y detalles').click()
  await expect(page.locator('article').first().getByRole('cell', { name: '0', exact: true })).toBeVisible()
  await expect(page.getByText('Vista previa de 1 registros. La descarga incluye todos.')).toBeVisible()
})
test('optional dates apply to downloads and can be cleared', async ({ page }) => {
  await page.goto('/dashboard/fichas-iot')
  await expect(page.getByText('42 registros disponibles')).toBeVisible()
  await page.getByRole('button', { name: 'Filtrar por fecha (opcional)' }).click()
  await page.getByLabel('Desde', { exact: true }).fill('2025-01-01')
  await page.getByLabel('Hasta', { exact: true }).fill('2025-01-31')
  const applied = page.waitForRequest(r => r.url().includes('/automaticas?') && r.url().includes('desde='))
  await page.getByRole('button', { name: 'Aplicar fechas' }).click()
  const url = new URL((await applied).url())
  expect(url.searchParams.get('desde')).toBe('2025-01-01T05:00:00.000Z')
  expect(url.searchParams.get('hasta')).toBe('2025-02-01T04:59:59.999Z')
  await expect(page.getByText('Periodo filtrado', { exact: false })).toBeVisible()
  const downloadRequest = page.waitForRequest(r => r.url().includes('/automaticas/pdf'))
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Descargar todo en PDF' }).click()
  expect(new URL((await downloadRequest).url()).searchParams.get('desde')).toBe(url.searchParams.get('desde'))
  await download
  await page.getByRole('button', { name: 'Ver todo', exact: true }).click()
  await expect(page.getByText('Todo el historial', { exact: false })).toBeVisible()
  await expect(page.locator('input[type=date]')).toHaveCount(0)
})

test('PDF server errors are decoded from the blob response', async ({ page }) => {
  await page.route(apiBase.replace(/\/$/, '') + '/fichas-iot/automaticas/pdf**', route => route.fulfill({
    status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'No se pudo cargar la fuente del PDF.' })
  }))
  await page.goto('/dashboard/fichas-iot')
  await expect(page.getByText('42 registros disponibles')).toBeVisible()
  await page.getByRole('button', { name: 'Descargar todo en PDF' }).click()
  await expect(page.getByText('No se pudo descargar el PDF. No se pudo cargar la fuente del PDF.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Descargar todo en Excel' })).toBeEnabled()
})
