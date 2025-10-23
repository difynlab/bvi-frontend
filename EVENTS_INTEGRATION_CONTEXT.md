# 🎯 Contexto Detallado: Integración de Eventos en BVI Frontend

## 📋 Tabla de Contenidos
1. [Arquitectura General](#arquitectura-general)
2. [Servicios y APIs](#servicios-y-apis)
3. [Hooks y Estado](#hooks-y-estado)
4. [Transformación de Datos](#transformación-de-datos)
5. [Validaciones Frontend](#validaciones-frontend)
6. [Componentes UI](#componentes-ui)
7. [Flujo de Datos](#flujo-de-datos)
8. [Manejo de Errores](#manejo-de-errores)
9. [Autenticación y Autorización](#autenticación-y-autorización)
10. [Estructura de Archivos](#estructura-de-archivos)

---

## 🏗️ Arquitectura General

### **Patrón de Arquitectura**
El proyecto utiliza una arquitectura basada en **React Hooks** con separación clara de responsabilidades:

```
Frontend (React) ↔ Backend (Laravel/PHP)
     ↓
Services Layer (API calls)
     ↓
Hooks Layer (State management)
     ↓
Components Layer (UI)
```

### **Principios de Diseño**
- **DRY (Don't Repeat Yourself)**: Lógica centralizada en hooks
- **KISS (Keep It Simple, Stupid)**: Interfaces simples y directas
- **BEM (Block Element Modifier)**: Metodología CSS consistente
- **Single Responsibility**: Cada archivo tiene una función específica

---

## 🔌 Servicios y APIs

### **EventsService (`src/services/eventsService.js`)**

#### **Configuración Base**
```javascript
class EventsService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api'
    this.tokenKey = 'token'
  }
}
```

#### **Métodos Principales**

**1. `getEvents(pagination = 6, page = 1)`**
- **Endpoint**: `GET /api/events?pagination=6&page=1`
- **Headers**: `Authorization: Bearer {token}`
- **Respuesta**: Lista paginada de eventos
- **Manejo de errores**: 404 → Empty state, otros → Error banner

**2. `getEvent(id)`**
- **Endpoint**: `GET /api/events/{id}`
- **Uso**: Obtener detalles de un evento específico
- **Respuesta**: Objeto evento completo

**3. `createEvent(eventData)`**
- **Endpoint**: `POST /api/events`
- **Content-Type**: `multipart/form-data` (para imágenes)
- **Datos**: FormData con todos los campos del evento
- **Respuesta**: Evento creado con ID generado

**4. `updateEvent(id, eventData)`**
- **Endpoint**: `POST /api/events/{id}`
- **Content-Type**: `multipart/form-data`
- **Datos**: FormData con campos actualizados
- **Respuesta**: Evento actualizado

**5. `deleteEvent(id)`**
- **Endpoint**: `DELETE /api/events/{id}`
- **Respuesta**: Confirmación de eliminación

#### **Manejo de Respuestas**
```javascript
async handleResponse(response) {
  if (!response.ok) {
    const data = await response.json()
    
    // Manejo específico por código de estado
    if (data.http_status === 401) {
      // Sesión expirada - logout automático
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem('user')
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.')
    } else if (data.http_status === 403) {
      throw new Error('Acceso denegado. Se requiere rol de administrador.')
    } else if (data.http_status === 400) {
      // Errores de validación del backend
      const errorMessage = data.message || 'Error de validación'
      const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
      throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
    }
    // ... más códigos de error
  }
  
  return await response.json()
}
```

---

## 🎣 Hooks y Estado

### **useEvents Hook (`src/hooks/useEvents.js`)**

#### **Estado Centralizado**
```javascript
const [events, setEvents] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
const [pagination, setPagination] = useState({
  current_page: 1,
  last_page: 1,
  per_page: 6,
  total: 0
})
```

#### **Funciones Principales**

**1. `loadEvents()`**
- Carga eventos desde el backend
- Aplica ordenamiento por fecha (más cercano → más lejano)
- Maneja paginación
- Actualiza estado de loading/error

**2. `createEvent(eventData)`**
- Transforma datos frontend → backend
- Envía FormData al servicio
- Actualiza lista local de eventos
- Maneja errores de validación

**3. `updateEvent(eventData)`**
- Preserva imagen existente si no se envía nueva
- Transforma datos para actualización
- Actualiza evento en lista local
- Mantiene ordenamiento por fecha

**4. `deleteEvent(id)`**
- Elimina evento del backend
- Remueve de lista local
- Actualiza paginación

**5. `sortEventsByDate(eventsList)`**
- Ordena eventos por fecha (ascendente)
- Maneja eventos sin fecha
- Retorna lista ordenada

### **useEventForm Hook (`src/hooks/useEventForm.js`)**

#### **Estado del Formulario**
```javascript
const [form, setForm] = useState({
  title: '',
  date: '',
  startTime: '',
  endTime: '',
  timeZone: 'UTC',
  eventType: 'conference',
  repeat: 'na',
  location: '',
  register_link: '',
  file: null,
  imagePreviewUrl: '',
  imageFileName: '',
  recurrence: null,
  status: 1
})
```

#### **Validaciones Frontend**
```javascript
const validate = (isEditMode = false) => {
  const errors = []
  
  // 📝 Campos de Texto (Mínimo 3 caracteres)
  if (!form.title.trim() || form.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long.')
  }
  
  // 📅 Campos de Fecha y Hora
  if (!form.date) {
    errors.push('Date is required.')
  } else {
    const selectedDate = new Date(form.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      errors.push('Date must be today or later.')
    }
  }
  
  // 🖼️ Archivo de Imagen
  if (!isEditMode && !form.file && !form.imagePreviewUrl) {
    errors.push('An image is required.')
  }
  
  if (form.file && form.file.size > 5 * 1024 * 1024) {
    errors.push('Image size must not exceed 5MB.')
  }
  
  // ... más validaciones
  
  setErrorMessage(errors.length > 0 ? errors.join(' ') : '')
  return errors.length === 0
}
```

#### **Construcción del Objeto Evento**
```javascript
const buildEventObject = (existingId = null) => {
  const id = existingId || Math.floor(Math.random() * 1000000000).toString()
  
  return {
    id,
    title: form.title,
    date: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    timeZone: form.timeZone,
    eventType: form.eventType,
    repeat: form.repeat,
    description: editorText,
    shortDescription: editorText,
    editorHtml: editorHtml,
    location: form.location,
    register_link: form.register_link,
    file: form.file,
    imageFileName: form.imageFileName || 'no-image.jpg',
    imagePreviewUrl: form.imagePreviewUrl || '',
    recurrence: form.recurrence,
    status: 1
  }
}
```

---

## 🔄 Transformación de Datos

### **EventTransformers (`src/utils/eventTransformers.js`)**

#### **Mapeo de Campos**
```javascript
const FIELD_MAPPINGS = {
  frontendToBackend: {
    id: 'id',
    title: 'title',
    eventType: 'category',
    date: 'date',
    startTime: 'start_time',
    endTime: 'end_time',
    repeat: 'repeat',
    description: 'content',
    shortDescription: 'short_description',
    location: 'location',
    register_link: 'register_link',
    file: 'thumbnail',
    imageFileName: 'imageFileName',
    imagePreviewUrl: 'imagePreviewUrl',
    recurrence: 'recurrence',
    status: 'status'
  },
  backendToFrontend: {
    id: 'id',
    title: 'title',
    category: 'eventType',
    date: 'date',
    start_time: 'startTime',
    end_time: 'endTime',
    repeat: 'repeat',
    content: 'description',
    short_description: 'shortDescription',
    location: 'location',
    register_link: 'register_link',
    thumbnail: 'imageFileName',
    imageFileName: 'imageFileName',
    imagePreviewUrl: 'imagePreviewUrl',
    recurrence: 'recurrence',
    status: 'status'
  }
}
```

#### **Mapeo de Valores**
```javascript
const VALUE_MAPPINGS = {
  eventType: {
    frontendToBackend: {
      'Conference': 'conference',
      'Webinar': 'webinar',
      'Workshop': 'workshop'
    },
    backendToFrontend: {
      'conference': 'Conference',
      'webinar': 'Webinar',
      'workshop': 'Workshop'
    }
  },
  repeat: {
    frontendToBackend: {
      'NONE': 'na',
      'DAILY': 'daily',
      'WEEKLY': 'weekly',
      'MONTHLY': 'monthly',
      'YEARLY': 'annually',
      'CUSTOM': 'custom'
    },
    backendToFrontend: {
      'na': 'NONE',
      'daily': 'DAILY',
      'weekly': 'WEEKLY',
      'monthly': 'MONTHLY',
      'annually': 'YEARLY',
      'custom': 'CUSTOM'
    }
  }
}
```

#### **Funciones de Transformación**

**1. `transformToBackend(frontendEvent, isUpdate, existingThumbnail)`**
- Convierte datos frontend → backend
- Maneja imágenes para crear/actualizar
- Aplica mapeos de campos y valores
- Genera short_description automáticamente

**2. `transformFromBackend(backendEvent)`**
- Convierte datos backend → frontend
- Construye URLs de imágenes
- Aplica mapeos inversos
- Establece valores por defecto

---

## ✅ Validaciones Frontend

### **Tipos de Validación**

#### **1. Campos de Texto (Mínimo 3 caracteres)**
- ✅ `title` - required|min:3
- ✅ `content` - required|min:3
- ✅ `location` - required|min:3
- ✅ `register_link` - required|min:3

#### **2. Campos de Fecha y Hora**
- ✅ `date` - required|date|after_or_equal:today
- ✅ `start_time` - required|regex:/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
- ✅ `end_time` - required|regex:/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
- ✅ Lógica: `start_time < end_time`

#### **3. Campos de Selección (Enum)**
- ✅ `category` - required|in:workshop,webinar,conference
- ✅ `repeat` - required|in:na,daily,weekly,monthly,annually,custom

#### **4. Archivo de Imagen**
- ✅ `thumbnail` - required (crear) / nullable (actualizar)
- ✅ Tamaño máximo - 5MB (5120 KB)
- ✅ Formatos - JPG, PNG, GIF, WebP

### **Manejo de Errores**
```javascript
// Banner de errores en el formulario
{(missingRequired.length > 0 || eventForm.errorMessage) && (
  <div className="app-form__error-banner" role="alert">
    {missingRequired.length > 0 && (
      <div>
        <strong>Please fill all required fields:</strong> {missingRequired.join(', ')}
      </div>
    )}
    {eventForm.errorMessage && (
      <div>
        <strong>Error:</strong> {eventForm.errorMessage}
      </div>
    )}
  </div>
)}
```

---

## 🎨 Componentes UI

### **Events Component (`src/sections/events/Events.jsx`)**

#### **Estructura Principal**
```javascript
export const Events = () => {
  const { user, toggleRole, isInitialized } = useAuth()
  const { events, createEvent, updateEvent, deleteEvent, loading, error, pagination, refreshEvents, changePage } = useEvents()
  
  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingEventId, setEditingEventId] = useState(null)
  
  // Hooks adicionales
  const eventForm = useEventForm()
  const modalState = useModalState()
  const modalBackdropClose = useModalBackdropClose()
  
  // ... lógica del componente
}
```

#### **Funciones Principales**

**1. `handleSubmit(e)`**
```javascript
const handleSubmit = (e) => {
  try {
    e.preventDefault()
    if (!validateRequired()) { bannerRef.current?.focus(); return; }
    
    const isEditMode = modalMode === 'edit'
    if (!eventForm.validate(isEditMode)) { 
      bannerRef.current?.focus(); 
      return; 
    }

    if (modalMode === 'create') {
      const newEvent = eventForm.buildEventObject()
      createEvent(newEvent)
    } else if (modalMode === 'edit' && editingEventId) {
      const updatedEvent = eventForm.buildEventObject(editingEventId)
      updateEvent(updatedEvent)
    }

    closeModal()
  } catch (error) {
    console.error('Error in handleSubmit:', error)
    alert('An error occurred while saving the event')
  }
}
```

**2. `handleEdit(event)`**
```javascript
const handleEdit = (event) => {
  eventForm.beginEdit(event)
  setEditingEventId(event.id)
  setModalMode('edit')
  setIsModalOpen(true)
}
```

**3. `handleDelete(event)`**
```javascript
const handleDelete = (event) => {
  setDeletingEvent(event)
  setIsDeleteModalOpen(true)
}
```

#### **Renderizado Condicional**
```javascript
const renderContent = () => {
  if (loading) return <EventsPageSkeleton />
  if (error) return <EmptyPage type="error" message={error} />
  if (events.length === 0) return <EmptyPage type="user" />
  
  return (
    <>
      <EventsHeader />
      <EventsList />
      <EventsPagination />
    </>
  )
}
```

### **Componentes de Skeleton**
- `EventsPageSkeleton.jsx` - Skeleton completo de la página
- `EventsHeaderSkeleton.jsx` - Skeleton del header
- `EventsListSkeleton.jsx` - Skeleton de la lista
- `EventsPaginationSkeleton.jsx` - Skeleton de paginación
- `EventCardSkeleton.jsx` - Skeleton de tarjeta individual

---

## 🔄 Flujo de Datos

### **Flujo de Creación de Evento**
```
1. Usuario hace clic en "Add Event"
   ↓
2. Se abre modal con formulario vacío
   ↓
3. Usuario llena formulario
   ↓
4. Validaciones frontend (useEventForm.validate)
   ↓
5. Si válido → eventForm.buildEventObject()
   ↓
6. transformToBackend() convierte datos
   ↓
7. eventsService.createEvent() envía FormData
   ↓
8. Backend procesa y responde
   ↓
9. useEvents.createEvent() actualiza estado local
   ↓
10. Modal se cierra, lista se actualiza
```

### **Flujo de Actualización de Evento**
```
1. Usuario hace clic en "Edit" en tarjeta
   ↓
2. eventForm.beginEdit(event) carga datos
   ↓
3. Modal se abre en modo 'edit'
   ↓
4. Usuario modifica datos
   ↓
5. Validaciones frontend
   ↓
6. transformToBackend() con isUpdate=true
   ↓
7. eventsService.updateEvent() envía datos
   ↓
8. useEvents.updateEvent() actualiza lista local
   ↓
9. Modal se cierra, cambios se reflejan
```

### **Flujo de Eliminación de Evento**
```
1. Usuario hace clic en "Delete" en tarjeta
   ↓
2. Se abre modal de confirmación
   ↓
3. Usuario confirma eliminación
   ↓
4. eventsService.deleteEvent() envía DELETE
   ↓
5. useEvents.deleteEvent() remueve de lista local
   ↓
6. Modal se cierra, lista se actualiza
```

---

## ⚠️ Manejo de Errores

### **Tipos de Errores**

#### **1. Errores de Red (4xx, 5xx)**
```javascript
// En eventsService.handleResponse()
if (data.http_status === 400) {
  const errorMessage = data.message || 'Error de validación'
  const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
  throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
}
```

#### **2. Errores de Validación Frontend**
```javascript
// En useEventForm.validate()
const errors = []
if (!form.title.trim() || form.title.trim().length < 3) {
  errors.push('Title must be at least 3 characters long.')
}
setErrorMessage(errors.length > 0 ? errors.join(' ') : '')
```

#### **3. Errores de Estado**
```javascript
// En useEvents
const [error, setError] = useState(null)

try {
  const response = await eventsService.getEvents()
  setEvents(response.data)
  setError(null)
} catch (err) {
  console.error('Error loading events:', err)
  setError(err.message)
}
```

### **Estrategias de Recuperación**

#### **1. Sesión Expirada (401)**
- Limpieza automática de localStorage
- Redirección a login
- Mensaje informativo al usuario

#### **2. Acceso Denegado (403)**
- Mensaje de error específico
- Posible toggle de rol (si es admin)

#### **3. Error de Servidor (500)**
- Log del error en consola
- Mensaje genérico al usuario
- Retry automático en algunos casos

#### **4. Datos No Encontrados (404)**
- Empty state en lugar de error
- Posibilidad de crear nuevo evento

---

## 🔐 Autenticación y Autorización

### **AuthContext Integration**
```javascript
// En Events.jsx
const { user, toggleRole, isInitialized } = useAuth()

// Verificación de rol para acciones admin
{user?.role === 'admin' && (
  <button onClick={handleAddEvent}>
    Add Event
  </button>
)}
```

### **Headers de Autenticación**
```javascript
// En eventsService.getHeaders()
getHeaders(includeContentType = true) {
  const headers = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${this.getToken()}`
  }
  
  if (includeContentType) {
    headers['Content-Type'] = 'application/json'
  }
  
  return headers
}
```

### **Manejo de Tokens**
```javascript
getToken() {
  return localStorage.getItem(this.tokenKey)
}

// En handleResponse para 401
if (data.http_status === 401) {
  localStorage.removeItem(this.tokenKey)
  localStorage.removeItem('user')
  throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.')
}
```

---

## 📁 Estructura de Archivos

### **Archivos Principales**
```
src/
├── services/
│   └── eventsService.js          # Servicio API unificado
├── hooks/
│   ├── useEvents.js              # Hook principal de eventos
│   └── useEventForm.js           # Hook del formulario
├── utils/
│   └── eventTransformers.js     # Transformación de datos
├── sections/
│   └── events/
│       └── Events.jsx            # Componente principal
├── components/
│   ├── events/                   # Componentes específicos
│   │   ├── EventCardSkeleton.jsx
│   │   ├── EventsHeaderSkeleton.jsx
│   │   ├── EventsListSkeleton.jsx
│   │   ├── EventsPaginationSkeleton.jsx
│   │   └── CustomRecurrencePopover.jsx
│   └── modals/
│       ├── ConfirmDeleteModal.jsx
│       └── SuccessDeleteModal.jsx
├── pages/
│   └── EventsPageSkeleton.jsx    # Skeleton de página completa
└── styles/
    ├── sections/
    │   └── Events.scss            # Estilos principales
    └── components/
        └── SuccessDeleteModal.scss
```

### **Dependencias Externas**
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "react-quill": "^2.0.0"
}
```

---

## 🚀 Características Avanzadas

### **1. Skeleton Loading**
- Estados de carga realistas
- Mejora UX durante fetch de datos
- Componentes específicos por sección

### **2. Paginación**
- 6 eventos por página por defecto
- Navegación entre páginas
- Estado persistente de página actual

### **3. Ordenamiento**
- Eventos ordenados por fecha (ascendente)
- Más cercano → más lejano
- Manejo de eventos sin fecha

### **4. Recurencia Personalizada**
- Componente CustomRecurrencePopover
- Configuración avanzada de repetición
- Integración con formulario principal

### **5. Rich Text Editor**
- Editor WYSIWYG para descripción
- Conversión HTML ↔ texto plano
- Validación de contenido mínimo

### **6. Upload de Imágenes**
- Drag & drop support
- Preview de imagen
- Validación de tamaño y formato
- Compresión automática

---

## 🔧 Configuración y Setup

### **Variables de Entorno**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=BVI Frontend
```

### **Configuración de Vite**
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### **Scripts de Desarrollo**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

---

## 📊 Métricas y Performance

### **Optimizaciones Implementadas**
- **Lazy Loading**: Componentes cargados bajo demanda
- **Memoización**: useCallback para funciones estables
- **Estado Local**: Minimiza re-renders innecesarios
- **Skeleton Loading**: Percepción de velocidad mejorada

### **Monitoreo de Errores**
- Console.error para errores críticos
- Try-catch en operaciones async
- Validación defensiva de datos
- Fallbacks para estados de error

---

## 🎯 Conclusiones

### **Fortalezas del Sistema**
1. **Arquitectura Limpia**: Separación clara de responsabilidades
2. **Reutilización**: Hooks centralizados y componentes modulares
3. **UX Excelente**: Skeleton loading, validaciones en tiempo real
4. **Manejo de Errores**: Robusto y user-friendly
5. **Escalabilidad**: Fácil agregar nuevas funcionalidades

### **Áreas de Mejora Futura**
1. **Testing**: Implementar tests unitarios e integración
2. **Caching**: Implementar cache de eventos
3. **Offline Support**: PWA capabilities
4. **Real-time Updates**: WebSocket para actualizaciones en vivo
5. **Analytics**: Tracking de interacciones de usuario

### **Lecciones Aprendidas**
1. **Validación Dual**: Frontend + Backend para mejor UX
2. **Transformación de Datos**: Crítico para integración API
3. **Manejo de Estados**: Loading, error, success states
4. **User Feedback**: Mensajes claros y accionables
5. **Performance**: Skeleton loading mejora percepción

---

*Este documento proporciona un contexto completo de la integración de eventos en el proyecto BVI Frontend, cubriendo todos los aspectos técnicos, arquitectónicos y de experiencia de usuario.*

