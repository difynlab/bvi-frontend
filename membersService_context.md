# MembersService - Contexto Actual

## Estructura del Servicio

**Archivo:** `src/services/membersService.js`

**Base URL:** `import.meta.env.VITE_API_BASE_URL || '/api'`

**Autenticación:** Usa token Bearer desde `localStorage.getItem('token')`

## Métodos Implementados Actualmente

### 1. `getMembers(params = {})`
- **Endpoint:** `GET /members`
- **Query params:** `pagination` (default: 6), `page` (default: 1)
- **Descripción:** Obtiene lista paginada de miembros (excluye usuario actual)
- **Retorna:** Respuesta del backend con estructura `{ data: { data: [], current_page, last_page, per_page, total } }`

### 2. `getMember(id)`
- **Endpoint:** `GET /members/{id}`
- **Descripción:** Obtiene detalles de un miembro específico
- **Retorna:** Datos del miembro

### 3. `createMember(data)`
- **Endpoint:** `POST /members`
- **Body:** FormData (soporta archivos/imágenes)
- **Descripción:** Crea un nuevo miembro
- **Retorna:** Datos del miembro creado

### 4. `updateMember(id, data)`
- **Endpoint:** `POST /members/{id}`
- **Body:** FormData (soporta archivos/imágenes)
- **Descripción:** Actualiza información de un miembro existente
- **Retorna:** Datos del miembro actualizado

### 5. `deleteMember(id)`
- **Endpoint:** `DELETE /members/{id}`
- **Descripción:** Elimina un miembro
- **Retorna:** Respuesta de confirmación

## Helpers Internos

### `getToken()`
- Obtiene token de autenticación desde localStorage

### `isAuthenticated()`
- Verifica si hay token válido

### `getCurrentUser()`
- Obtiene usuario actual desde localStorage

### `getHeaders(includeContentType = false)`
- Construye headers HTTP con Authorization Bearer
- Opcionalmente incluye Content-Type: application/json

### `buildQuery(params = {})`
- Construye query string filtrando valores undefined/null/empty

### `handleResponse(response)`
- Maneja respuestas HTTP unificadas
- Maneja errores: 401 (sesión expirada), 403 (acceso denegado), 400/422 (validación), 404 (no encontrado), 500 (error servidor)
- Retorna JSON parseado o texto

## Manejo de Errores

- **401:** Limpia token y lanza error "Sesión expirada"
- **403:** Lanza error "Acceso denegado. Se requiere rol de administrador"
- **400/422:** Lanza error con mensaje y errores de validación
- **404:** Retorna objeto con `http_status: 404` y `data: []`
- **500:** Lanza error con mensaje del servidor

## Formato de Datos

- **FormData:** Se usa para `createMember` y `updateMember` (permite enviar archivos)
- **JSON:** Se usa para requests GET/DELETE
- **Headers:** Siempre incluye `Accept: application/json` y `Authorization: Bearer {token}`

## Métodos NO Implementados (Faltantes)

- ❌ `renewMember(id)` - Renovar membresía
- ❌ `suspendMember(id)` - Suspender miembro
- ❌ `activateMember(id)` - Activar miembro
- ❌ `getMemberPayments(id)` - Obtener historial de pagos
- ❌ `getMemberSubscriptions(id)` - Obtener suscripciones
- ❌ Cualquier otro endpoint relacionado con membresías que exista en el backend

## Notas

- El servicio usa el patrón de instancia única (singleton): `export default new MembersService()`
- Todos los métodos son async y retornan Promises
- El servicio maneja automáticamente la autenticación mediante tokens
- Los métodos que envían FormData NO incluyen Content-Type (el navegador lo establece automáticamente con boundary)

