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

test('summary shows API totals and real series without browser errors', async ({
  page
}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible()
  await expect(
    page.getByRole('img', { name: /Tendencia de humedad/ })
  ).toBeVisible()
  await expect(page.getByText('Registro de prueba').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.screenshot({
    path: 'test-results/dashboard-desktop.png',
    fullPage: true
  })
  expect(errors).toEqual([])
})

test('every module loads and opens record details', async ({ page }) => {
  for (const module of [
    'parcelas',
    'cultivos',
    'dispositivos',
    'sensores',
    'tipos-sensor',
    'lecturas',
    'riegos',
    'alertas',
    'predicciones',
    'modelos-ia',
    'reportes',
    'notificaciones'
  ]) {
    await page.goto('/dashboard/' + module)
    await expect(
      page.getByRole('button', { name: 'Ver detalle' }).first()
    ).toBeVisible()
    await page.getByRole('button', { name: 'Ver detalle' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText('Cargando detalle…')).toHaveCount(0)
    await expect(
      page.getByRole('dialog').getByText('Sin datos registrados.')
    ).toHaveCount(0)
  }
  await page.goto('/dashboard/configuracion-alertas?parcelaId=' + parcelaId)
  await expect(page.getByRole('button', { name: 'Ver detalle' })).toBeVisible()
})

test('pagination and filters are sent to the API', async ({ page }) => {
  await page.goto('/dashboard/parcelas')
  await expect(page.getByText('Página 1 de 2')).toBeVisible()
  await page.getByRole('button', { name: 'Página siguiente' }).click()
  await expect(page.getByText('Segunda página')).toBeVisible()
  await page.getByLabel('Activa', { exact: true }).selectOption('false')
  const response = page.waitForRequest(
    request =>
      new URL(request.url()).pathname === '/parcelas'
        && new URL(request.url()).searchParams.get('activa') === 'false'
  )
  await page.getByRole('button', { name: 'Aplicar filtros' }).click()
  const url = new URL((await response).url())
  expect(url.searchParams.get('page')).toBe('1')
})

test('API failure is not shown as an empty result', async ({ page }) => {
  await page.route(apiBase.replace(/\/$/, '') + '/riegos?**', route =>
    route.fulfill({ status: 500, json: { message: 'Unavailable' } })
  )
  await page.goto('/dashboard/riegos')
  await expect(page.getByText('No se pudo cargar el módulo')).toBeVisible()
  await expect(
    page.getByText('No hay registros para esta consulta.')
  ).toHaveCount(0)
})

test('mobile dashboard opens navigation without horizontal overflow', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
  await page.waitForLoadState('networkidle')
  await page.screenshot({
    path: 'test-results/dashboard-mobile.png',
    fullPage: true
  })
})

test('creates a parcel with numeric DTO fields and preserves API errors', async ({
  page
}) => {
  await page.route(apiBase.replace(/\/$/, '') + '/parcelas', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback()
    await route.fulfill({
      status: 400,
      json: { message: 'Nombre ya registrado' }
    })
  })
  await page.goto('/dashboard/parcelas')
  await page.getByRole('button', { name: 'Nuevo registro' }).click()
  const dialog = page.getByRole('dialog')
  await dialog
    .getByLabel('Nombre', { exact: false })
    .first()
    .fill('Parcela nueva')
  await dialog.getByLabel('Área (ha)').fill('2.75')
  const sent = page.waitForRequest(
    r => r.method() === 'POST' && new URL(r.url()).pathname === '/parcelas'
  )
  await dialog.getByRole('button', { name: 'Guardar cambios' }).click()
  expect((await sent).postDataJSON()).toEqual({
    nombre: 'Parcela nueva',
    areaHectareas: 2.75
  })
  await expect(dialog.getByText('Nombre ya registrado')).toBeVisible()
  await expect(dialog.getByLabel('Área (ha)')).toHaveValue('2.75')
})

test('notification tray marks all notifications read using the API', async ({
  page
}) => {
  await page.goto('/dashboard')
  await page.getByRole('button', { name: /Abrir notificaciones/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('Mensaje de prueba')).toBeVisible()
  const sent = page.waitForRequest(
    r =>
      r.method() === 'PUT'
      && new URL(r.url()).pathname === '/notificaciones/leer-todas'
  )
  await dialog.getByRole('button', { name: 'Leer todas', exact: true }).click()
  await sent
})

test('all creation forms load their required relationship options', async ({
  page
}) => {
  test.setTimeout(120000)
  for (const key of [
    'cultivos',
    'dispositivos',
    'sensores',
    'tipos-sensor',
    'lecturas',
    'riegos',
    'alertas',
    'predicciones',
    'modelos-ia',
    'reportes',
    'configuracion-alertas'
  ]) {
    await page.goto('/dashboard/' + key)
    await page
      .getByRole('button', {
        name: /^(Nuevo registro|Generar predicción|Configurar umbrales)$/
      })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Cargando formulario…')).toHaveCount(0)
    await expect(
      dialog.getByRole('button', { name: 'Guardar cambios' })
    ).toBeEnabled()
    await expect(
      dialog.locator('input, select, textarea').first()
    ).toBeVisible()
  }
})

test('additional database modules and admin navigation load with authorized responses', async ({
  page
}) => {
  test.setTimeout(120000)
  await page.route(apiBase.replace(/\/$/, '') + '/auth/profile', route =>
    route.fulfill({
      json: {
        id: owner,
        nombres: 'Ana',
        apellidos: 'Prueba',
        email: 'test@example.com',
        estado: true,
        roles: [{ id: 1, nombre: 'Administrador', codigo: 'admin' }]
      }
    })
  )
  await page.route(apiBase.replace(/\/$/, '') + '/gestion/**', (route) => {
    const path = new URL(route.request().url()).pathname
    const record = {
      ...row,
      id: owner,
      full_name: 'Ana Prueba',
      role_id: 1,
      roles: { nombre: 'Administrador' },
      clave: 'riego',
      valor: { enabled: true }
    }
    return route.fulfill({
      json:
        path === '/gestion/perfil'
          ? record
          : ['/gestion/roles', '/gestion/sistema'].includes(path)
              ? [record]
              : {
                  data: [record],
                  meta: { total: 1, page: 1, limit: 20, totalPages: 1 }
                }
    })
  })
  for (const key of [
    'eventos',
    'evaluaciones',
    'accesos',
    'auditoria',
    'dispositivos-push',
    'perfil',
    'usuarios',
    'roles',
    'sistema'
  ]) {
    await page.goto('/dashboard/' + key)
    await expect(
      page.getByRole('button', { name: 'Ver detalle' }).first()
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Usuarios', exact: true })
    ).toBeVisible()
  }
})
