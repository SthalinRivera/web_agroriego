# Cobertura y verificación de Agroriego

## Implementado

- Interfaz compacta adaptable a escritorio y móvil, indicadores de estado y acceso a notificaciones en la barra superior.
- Formularios basados en los DTO del backend, conversión de valores numéricos/booleanos, relaciones seleccionables, validación de rangos y errores del servidor conservando el formulario.
- Confirmación antes de eliminar registros o ejecutar cambios de estado.
- Bandeja de notificaciones con contador, lectura individual/reversible y lectura masiva. Consulta cada 30 segundos mientras la pestaña está visible.
- Avisos opcionales del navegador mientras la aplicación permanece abierta. Requieren permiso y un contexto seguro; no sustituyen el push en segundo plano de Firebase.
- Dispositivos push: consulta de los propios equipos y desactivación. No se exponen tokens FCM.
- Administración de usuarios y configuración reservada al código de rol `admin`, verificado contra la base en cada operación. No permite cambiar los permisos de la propia cuenta desde esa pantalla.

## Correspondencia con las tablas públicas

| Tabla | Funcionalidad web |
| --- | --- |
| parcelas | Consulta, detalle, creación, edición y eliminación |
| cultivos | Consulta, creación, edición y eliminación |
| dispositivos | Consulta, creación, edición y eliminación |
| sensores | Consulta, creación, edición, calibración y eliminación |
| tipos_sensor | Catálogo y registro de tipos |
| lecturas | Historial, filtros, registro manual, estadísticas y tendencia de humedad |
| riegos | Registro, edición, finalización y cancelación |
| alertas | Consulta, creación, atención, resolución y descarte |
| configuracion_alertas | Consulta y configuración de umbrales por parcela |
| notificaciones | Bandeja, lectura, pendientes y solicitud de prueba a los dispositivos registrados |
| user_devices | Consulta propia y desactivación de recepción |
| predicciones | Consulta y generación con el simulador existente |
| modelos_ia | Consulta, métricas, registro, edición, activación y eliminación |
| evaluaciones_prediccion | Consulta y registro de valores observados, con cálculo de error absoluto y porcentual |
| reportes | Registro, consulta, eliminación y generación de análisis simulado |
| reportes_ia | Información anidada en el detalle del reporte |
| device_logs | Consulta paginada de eventos de equipos accesibles |
| parcela_usuarios | Consulta y gestión de accesos por correo para el propietario; consulta del acceso propio para miembros |
| profiles | Perfil personal editable; administración de rol/estado para administradores |
| roles | Catálogo administrativo; selección de rol al administrar una cuenta |
| auditoria | Consulta del historial propio, sin payloads que puedan contener credenciales |
| configuracion_sistema | Consulta y guardado de parámetros JSON para administradores |

Las tablas del esquema `auth` pertenecen a Supabase. El inicio de sesión y el proveedor de identidad siguen administrados por Supabase; no se ofrece edición directa de contraseñas, tokens, MFA ni sesiones mediante CRUD.

## Verificación y alcance

La conexión configurada a PostgreSQL respondió a una consulta de metadatos de tablas y roles, sin modificar registros. La API y la web compilan. Las pruebas del navegador usan respuestas de API controladas; verifican navegación, peticiones, formularios, errores, notificaciones y adaptación móvil, pero no certifican un flujo real de autenticación/escritura en producción.

No se ejecutaron migraciones, borrados ni escrituras de prueba en la base real. No se desplegaron los cambios. Deben publicarse juntos frontend y API, porque las nuevas pantallas usan las rutas `/gestion/*`.

## Límites existentes

- La inferencia y el análisis de reportes del backend siguen siendo simulaciones, identificadas en pantalla.
- Registrar un reporte no genera por sí solo un archivo PDF/Excel: el backend existente guarda el registro y el análisis.
- Compartir una parcela requiere una cuenta activa ya registrada; no envía invitaciones por correo. Los niveles aceptados se verificaron contra la restricción de PostgreSQL.
- La creación de nuevas cuentas continúa dependiendo del flujo de Supabase; la pantalla administrativa gestiona cuentas ya registradas.
- La entrega real de Firebase y la recepción en un equipo requieren una sesión/dispositivo de prueba. No se enviaron avisos a dispositivos reales durante la verificación.
- Los permisos de escritura de los módulos preexistentes conservan sus reglas actuales. No se declara una auditoría integral de seguridad del backend.

## Comandos

```powershell
# app-web
npm run typecheck
npm run lint
npm run build
$env:E2E_PRODUCTION = '1'
npm run test:e2e

# api-agrotec
npm run build
npm test -- --runInBand
```

`E2E_PRODUCTION=1` prueba la compilación en localhost:3100 para no interferir con el desarrollo en localhost:3000. Después de cambios en DTO se puede regenerar el catálogo con `node scripts/generate-forms.mjs`; los campos propios de gestión se mantienen en `app/utils/agro-forms-extra.json`.
