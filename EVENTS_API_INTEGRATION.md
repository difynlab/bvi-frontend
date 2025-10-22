# 📋 Integración Frontend - Crear Eventos (Add Events)

## 🎯 **Resumen**
Documentación completa de cómo funciona la integración frontend para crear eventos, incluyendo todos los datos que se envían al backend, tipos de eventos, opciones de repetición y estructura de la API.

---

## 🔧 **Arquitectura del Sistema**

### **Flujo de Creación de Eventos:**
```
1. Usuario llena formulario → useEventForm.js
2. Datos se transforman → eventTransformers.js  
3. Se envían al backend → eventsService.js
4. Backend procesa imagen → GD Extension
5. Se guarda en BD → SQLite
6. Se actualiza lista → useEvents.js
```

---

## 📡 **API Endpoint**

### **Crear Evento**
- **URL:** `POST /api/events`
- **Autenticación:** Bearer Token (requerido)
- **Rol:** Solo administradores
- **Content-Type:** `multipart/form-data` (FormData)

---

## 📊 **Estructura de Datos Enviados**

### **FormData Fields:**

| Campo | Tipo | Valor | Descripción |
|-------|------|-------|-------------|
| `id` | String | `"123456789"` | ID único generado automáticamente |
| `title` | String | `"Taller de React"` | Título del evento (requerido, min 3 chars) |
| `category` | String | `"conference"` | Tipo de evento (ver tipos abajo) |
| `date` | String | `"2025-10-25"` | Fecha en formato YYYY-MM-DD |
| `start_time` | String | `"14:30"` | Hora de inicio en formato HH:MM |
| `end_time` | String | `"16:00"` | Hora de fin en formato HH:MM |
| `repeat` | String | `"na"` | Frecuencia de repetición (ver opciones abajo) |
| `content` | String | `"<h2>Contenido del taller</h2>"` | Descripción completa (HTML) |
| `short_description` | String | `"Taller práctico..."` | Descripción corta (texto plano) |
| `location` | String | `"Sala A"` | Ubicación del evento |
| `register_link` | String | `"https://forms.example.com"` | Link de registro |
| `status` | Number | `1` | Estado del evento (1=activo, 0=inactivo) |
| `thumbnail` | File | `File object` | Imagen del evento (max 5MB) |

---

## 🏷️ **Tipos de Eventos (EVENT_TYPES)**

```javascript
const EVENT_TYPES = [
  'conference',    // Conferencia
  'webinar',       // Webinar  
  'workshop'       // Taller
]
```

### **Mapeo de Valores:**
- ✅ **Frontend → Backend:** `'conference'` → `'conference'`
- ✅ **Frontend → Backend:** `'webinar'` → `'webinar'`
- ✅ **Frontend → Backend:** `'workshop'` → `'workshop'`

---

## 🔄 **Opciones de Repetición (REPEAT_OPTIONS)**

```javascript
const REPEAT_OPTIONS = [
  { label: 'None',      value: 'na' },
  { label: 'Daily',     value: 'DAILY' },
  { label: 'Weekly',    value: 'WEEKLY' },
  { label: 'Monthly',   value: 'MONTHLY' },
  { label: 'Yearly',    value: 'YEARLY' },
  { label: 'Custom...', value: 'CUSTOM' }
]
```

### **Mapeo de Valores:**
- ✅ **Frontend → Backend:** `'na'` → `'na'` (sin repetición)
- ✅ **Frontend → Backend:** `'DAILY'` → `'DAILY'`
- ✅ **Frontend → Backend:** `'WEEKLY'` → `'WEEKLY'`
- ✅ **Frontend → Backend:** `'MONTHLY'` → `'MONTHLY'`
- ✅ **Frontend → Backend:** `'YEARLY'` → `'YEARLY'`
- ✅ **Frontend → Backend:** `'CUSTOM'` → `'CUSTOM'`

---

## 🔐 **Headers HTTP**

### **Headers Enviados:**
```javascript
{
  'Accept': 'application/json',
  'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...'
}
```

### **Headers NO Enviados:**
- ❌ `Content-Type` - Se omite para FormData (se establece automáticamente)

---

## 📁 **Procesamiento de Archivos**

### **Campo de Imagen:**
- **Campo:** `thumbnail`
- **Tipo:** `File` object
- **Límite:** 5MB máximo
- **Formatos:** PNG, JPG, JPEG, WEBP
- **Procesamiento:** GD Extension (PHP)

### **Ejemplo de File Object:**
```javascript
File {
  name: 'event-image.png',
  size: 1234567,
  type: 'image/png',
  lastModified: 1759848495431
}
```

---

## ⚠️ **Manejo de Errores**

### **Errores HTTP Específicos:**

| Código | Error | Acción |
|--------|-------|--------|
| `401` | Sesión expirada | Limpia localStorage, redirige a login |
| `403` | Acceso denegado | Mensaje: "Se requiere rol de administrador" |
| `400` | Error de validación | Muestra errores específicos del backend |
| `422` | Errores de validación | Muestra errores de campos específicos |
| `500` | Error interno | Mensaje genérico del servidor |

### **Ejemplo de Error 422:**
```json
{
  "http_status": 422,
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required"],
    "date": ["The date must be a valid date"]
  }
}
```

---

## 🎯 **Validaciones Frontend**

### **Validaciones Cliente:**
- ✅ **Título:** Mínimo 3 caracteres
- ✅ **Fecha:** Debe ser hoy o posterior
- ✅ **Hora inicio:** Debe ser anterior a hora fin
- ✅ **Imagen:** Máximo 5MB
- ✅ **Campos requeridos:** Todos los campos marcados como obligatorios

### **Validaciones Backend:**
- ✅ **Autenticación:** Token válido requerido
- ✅ **Autorización:** Rol de administrador requerido
- ✅ **Imagen:** GD extension instalada
- ✅ **Base de datos:** Tipos de datos correctos

---

## 🔄 **Transformación de Datos**

### **Frontend → Backend:**
```javascript
// Frontend (useEventForm.js)
{
  title: "Mi Evento",
  eventType: "conference",
  startTime: "09:00",
  endTime: "17:00",
  repeat: "na",
  file: File object
}

// Backend (eventTransformers.js)
{
  title: "Mi Evento",
  category: "conference",
  start_time: "09:00", 
  end_time: "17:00",
  repeat: "na",
  thumbnail: File object
}
```

---

## 📋 **Ejemplo Completo de Request**

### **FormData Enviado:**
```
id: "123456789"
title: "Taller de React Avanzado"
category: "workshop"
date: "2025-10-25"
start_time: "14:30"
end_time: "16:00"
repeat: "na"
content: "<h2>Taller práctico de React</h2><p>Aprende hooks avanzados...</p>"
short_description: "Taller práctico de React con hooks avanzados"
location: "Sala de Conferencias A"
register_link: "https://forms.example.com/react-workshop"
status: 1
thumbnail: File {name: 'react-workshop.png', size: 1234567, type: 'image/png'}
```

### **Headers:**
```
Accept: application/json
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

---

## ✅ **Respuesta Exitosa**

### **Estructura de Respuesta:**
```json
{
  "http_status": 200,
  "message": "Event created successfully",
  "data": {
    "id": "123456789",
    "title": "Taller de React Avanzado",
    "category": "workshop",
    "date": "2025-10-25",
    "start_time": "14:30",
    "end_time": "16:00",
    "repeat": "na",
    "content": "<h2>Taller práctico de React</h2>...",
    "short_description": "Taller práctico de React con hooks avanzados",
    "location": "Sala de Conferencias A",
    "register_link": "https://forms.example.com/react-workshop",
    "status": 1,
    "thumbnail": "processed-image-uuid.webp",
    "created_at": "2025-10-22T18:45:58.000000Z",
    "updated_at": "2025-10-22T18:45:58.000000Z"
  }
}
```

---

## 🚀 **Estado Actual del Sistema**

### **Funcionalidades Implementadas:**
- ✅ **CREATE** - Crear eventos con imágenes
- ✅ **READ** - Listar y ver eventos  
- ✅ **DELETE** - Eliminar eventos
- ❌ **UPDATE** - Deshabilitado

### **Componentes Involucrados:**
- `src/services/eventsService.js` - API service
- `src/hooks/useEvents.js` - Estado de eventos
- `src/hooks/useEventForm.js` - Formulario de eventos
- `src/utils/eventTransformers.js` - Transformación de datos
- `src/sections/events/Events.jsx` - Componente principal

---

## 🔧 **Configuración Requerida Backend**

### **PHP Extensions:**
- ✅ **GD Extension** - Para procesar imágenes
- ✅ **SQLite** - Base de datos
- ✅ **Laravel** - Framework

### **Permisos:**
- ✅ **Carpeta public** - Permisos de escritura
- ✅ **Uploads** - Directorio para imágenes

---

## 📝 **Notas Importantes**

1. **IDs:** Se generan automáticamente en el frontend usando `Math.floor(Math.random() * 1000000000).toString()`
2. **Status:** Se envía como número entero (`1` o `0`), no como string
3. **Imágenes:** Se procesan con GD extension y se convierten a WEBP
4. **Validación:** Doble validación (frontend + backend)
5. **Autenticación:** Bearer token requerido en todos los requests

---

*Documentación generada para integración con backend - Frontend BVI Events System*
