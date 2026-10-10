# Agroriego web

Portal Nuxt para Agroriego. Acceso con correo/contraseña o Google mediante Supabase y validación del perfil activo con `GET /auth/profile` de api-agrotec.

## Desarrollo

1. Instalar dependencias con `npm install`.
2. Copiar `.env.example` a `.env` y completar la URL y clave pública de Supabase. Debe ser el mismo proyecto de la API. Nunca usar una clave service-role en la web.
3. Configurar `NUXT_PUBLIC_API_BASE` (por defecto `http://localhost:4000`). También se admite la variable anterior `NUXT_PUBLIC_API_BASE_URL`.
4. Iniciar api-agrotec con `npm run start:dev`. Su `FRONTEND_URL` debe coincidir con el origen de la web (`http://localhost:3000`).
5. Ejecutar `npm run dev`.

## Acceso

La cuenta debe existir en Supabase Auth y tener un registro activo en `profiles`, con rol asignado. La web no crea perfiles ni otorga permisos automáticamente. No hay credenciales de demostración.

Para Google, habilitar el proveedor en Supabase y permitir `http://localhost:3000/auth/callback` como Redirect URL. Agregar el callback de producción cuando corresponda.

Supabase restaura y renueva la sesión. El callback y las rutas del panel verifican el perfil en la API. El cierre de sesión afecta este navegador. El portal usa renderizado cliente para mantener un único flujo de sesión.

## Verificación

- `npm run typecheck`
- `npm run lint`
- `npm run build`

Incluye login y dashboard agrícola con 13 módulos de consulta, filtros, paginación, detalles y gráfica de humedad. La estructura reutiliza los componentes de dashboard de Nuxt UI del proyecto anterior. El proyecto anterior se conserva en `legacy-quipubox/`, excluido de las rutas y del lint, para poder recuperar componentes.

## Dashboard y pruebas

El resumen consume totales reales y las vistas usan la API autenticada. Los análisis simulados se identifican expresamente. Revisión e inventario de las 79 rutas: ../api-agrotec/docs/REVISION-ENDPOINTS.md.

Ejecutar pruebas de navegador con npm run test:e2e. Usan Edge en modo sin interfaz, sesión ficticia y respuestas interceptadas dentro del navegador; no escriben en la base de datos. Requieren el .env local configurado. Los artefactos se guardan en test-results/.
