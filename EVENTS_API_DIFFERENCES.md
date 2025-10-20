# Diferencias entre Frontend y Backend API - Events

## Resumen de Diferencias Principales

El frontend actual maneja una estructura de datos diferente a la que espera la API del backend. Hay múltiples incompatibilidades en nombres de campos, tipos de datos y validaciones.

## 1. Diferencias en Nombres de Campos

### Campos con Nombres Diferentes

| Frontend | Backend API | Descripción |
|----------|-------------|-------------|
| `startTime` | `start_time` | Hora de inicio |
| `endTime` | `end_time` | Hora de fin |
| `eventType` | `category` | Tipo/categoría del evento |
| `imageFileName` | `thumbnail` | Nombre del archivo de imagen |
| `imagePreviewUrl` | `original_image` | URL de la imagen |
| `description` | `content` | Contenido del evento |
| `short_description` | ❌ **FALTA** | Descripción corta (no existe en frontend) |

### Campos Adicionales en Frontend

| Campo Frontend | Descripción | Estado en Backend |
|----------------|-------------|-------------------|
| `timeZone` | Zona horaria | ❌ **NO EXISTE** |
| `editorHtml` | HTML del editor WYSIWYG | ❌ **NO EXISTE** |
| `recurrence` | Objeto complejo de recurrencia | ❌ **NO EXISTE** |

### Campos Adicionales en Backend

| Campo Backend | Descripción | Estado en Frontend |
|---------------|-------------|-------------------|
| `status` | Estado del evento (0,1,2) | ❌ **NO EXISTE** |
| `created_at` | Fecha de creación | ❌ **NO EXISTE** |
| `updated_at` | Fecha de actualización | ❌ **NO EXISTE** |
| `blurred_image` | URL de imagen con blur | ❌ **NO EXISTE** |

## 2. Diferencias en Tipos de Datos

### Categorías/Tipos de Evento

**Frontend:**
```javascript
const EVENT_TYPES = [
  'Conference',
  'Webinar', 
  'Workshop'
]
```

**Backend:**
```sql
category ENUM('workshop', 'conference', 'webinar')
```

**⚠️ PROBLEMA:** Diferencias en capitalización y orden:
- Frontend: `Conference` → Backend: `conference`
- Frontend: `Webinar` → Backend: `webinar` 
- Frontend: `Workshop` → Backend: `workshop`

### Opciones de Repetición

**Frontend:**
```javascript
const REPEAT_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Custom...', value: 'CUSTOM' }
]
```

**Backend:**
```sql
repeat ENUM('na', 'daily', 'weekly', 'monthly', 'annually', 'custom')
```

**⚠️ PROBLEMA:** Valores completamente diferentes:
- Frontend: `NONE` → Backend: `na`
- Frontend: `DAILY` → Backend: `daily`
- Frontend: `WEEKLY` → Backend: `weekly`
- Frontend: `MONTHLY` → Backend: `monthly`
- Frontend: `YEARLY` → Backend: `annually`
- Frontend: `CUSTOM` → Backend: `custom`

### Zona Horaria

**Frontend:**
```javascript
const TIME_ZONES = [
  'UTC',
  'GMT', 
  'GMT-3',
  'GMT+1'
]
```

**Backend:** ❌ **NO EXISTE** - No hay campo para zona horaria

## 3. Diferencias en Validaciones

### Campos Requeridos

**Frontend (useEventForm.js):**
- `title` ✅
- `date` ✅
- `startTime` ✅
- `endTime` ✅
- `timeZone` ✅
- `eventType` ✅
- `description` ✅
- `location` ✅
- `file` (imagen) ✅

**Backend API:**
- `title` ✅
- `category` ✅
- `date` ✅
- `start_time` ✅
- `end_time` ✅
- `repeat` ✅
- `content` ✅
- `location` ✅
- `new_thumbnail` ✅
- `status` ✅

### Validaciones Específicas

**Frontend:**
- Título: mínimo 3 caracteres
- Descripción: mínimo 3 caracteres
- Ubicación: mínimo 3 caracteres
- Imagen: máximo 5MB
- Hora inicio < hora fin

**Backend:**
- Título: mínimo 3 caracteres ✅
- Categoría: debe ser workshop/webinar/conference ✅
- Fecha: debe ser hoy o posterior ✅
- Horarios: formato HH:MM ✅
- Repetición: debe ser na/daily/weekly/monthly/annually ✅
- Contenido: mínimo 3 caracteres ✅
- Ubicación: mínimo 3 caracteres ✅
- Imagen: máximo 5120 KB (5MB) ✅
- Estado: debe ser 0/1/2 ✅

## 4. Diferencias en Estructura de Recurrencia

### Frontend - Objeto Complejo
```javascript
recurrence: {
  kind: 'NONE' | 'WEEKLY' | 'CUSTOM',
  interval: 1,
  unit: 'week',
  daysOfWeek: ['MO','TU','WE','TH','FR','SA','SU'],
  ends: { 
    mode: 'NEVER' | 'ON_DATE' | 'AFTER_OCCURRENCES',
    date: '',
    count: null 
  }
}
```

### Backend - Campo Simple
```sql
repeat ENUM('na', 'daily', 'weekly', 'monthly', 'annually', 'custom')
```

**⚠️ PROBLEMA CRÍTICO:** El frontend maneja recurrencia compleja con configuraciones avanzadas, pero el backend solo soporta valores simples.

## 5. Diferencias en Manejo de Imágenes

### Frontend
- `imageFileName`: Nombre del archivo
- `imagePreviewUrl`: URL local del preview
- `file`: Objeto File del input

### Backend
- `thumbnail`: Nombre del archivo generado
- `original_image`: URL completa de la imagen
- `blurred_image`: URL de la imagen con blur
- `new_thumbnail`: Archivo subido en multipart/form-data

## 6. Diferencias en Respuestas de API

### Frontend Espera
```javascript
// Respuesta JSON directa
{
  id: 1,
  title: "Event Title",
  startTime: "09:00",
  endTime: "17:00",
  // ... otros campos
}
```

### Backend Devuelve
```javascript
// Para operaciones de escritura: Redirects HTML
HTTP 302 Found
Location: /admin/events/index

// Para operaciones de lectura: JSON con wrapper
{
  "http_status": 200,
  "http_status_message": "OK", 
  "message": "success",
  "data": { /* evento */ }
}
```

## 7. Verificaciones Necesarias

### ✅ Campos que Requieren Mapeo
1. **startTime** → **start_time**
2. **endTime** → **end_time** 
3. **eventType** → **category** (con conversión de valores)
4. **imageFileName** → **thumbnail**
5. **description** → **content**

### ✅ Campos que Requieren Conversión de Valores
1. **eventType**: `Conference` → `conference`
2. **repeat**: `NONE` → `na`, `YEARLY` → `annually`

### ✅ Campos que Requieren Implementación
1. **timeZone**: Agregar al backend o eliminar del frontend
2. **status**: Agregar al frontend (default: 2)
3. **short_description**: Agregar al frontend o eliminar del backend
4. **recurrence**: Implementar lógica compleja en backend o simplificar frontend

### ✅ Campos que Requieren Manejo Especial
1. **editorHtml**: Decidir si mantener HTML o convertir a texto plano
2. **imágenes**: Implementar upload multipart/form-data
3. **respuestas**: Cambiar redirects por respuestas JSON

## 8. Recomendaciones de Implementación

### Opción A: Adaptar Frontend al Backend
- Cambiar nombres de campos en frontend
- Simplificar recurrencia a valores simples
- Eliminar timeZone del frontend
- Agregar campo status al frontend
- Implementar manejo de respuestas HTML redirect

### Opción B: Adaptar Backend al Frontend  
- Cambiar nombres de campos en backend
- Implementar recurrencia compleja en backend
- Agregar campo timeZone al backend
- Mantener respuestas JSON para SPA
- Implementar manejo de HTML del editor

### Opción C: Crear Capa de Adaptación
- Crear funciones de mapeo bidireccional
- Mantener ambas estructuras
- Implementar transformaciones automáticas

## 9. Prioridades de Corrección

### 🔴 CRÍTICO (Bloquea funcionalidad)
1. Mapeo de nombres de campos
2. Conversión de valores de categorías y repetición
3. Manejo de respuestas de API

### 🟡 IMPORTANTE (Afecta UX)
1. Implementación de timeZone
2. Manejo de recurrencia compleja
3. Campos de estado y metadatos

### 🟢 DESEABLE (Mejoras)
1. Manejo de imágenes con blur
2. Validaciones mejoradas
3. Campos adicionales de descripción

