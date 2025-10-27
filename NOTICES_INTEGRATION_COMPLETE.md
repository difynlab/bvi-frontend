# 📋 Sistema de Notices - Integración Completa

## 🎯 **Resumen del Sistema**

El sistema de Notices permite crear, gestionar y mostrar avisos organizados por categorías. Cada notice puede tener una imagen, descripción, enlace y generar un PDF automáticamente.

---

## 🏗️ **Arquitectura General**

### **1. Componentes Principales**
```
src/
├── sections/notices/Notices.jsx          # Componente principal
├── hooks/useNoticesState.js             # Estado y lógica de notices
├── services/noticesService.js           # API calls
├── utils/noticeTransformers.js          # Transformación de datos
├── components/notices/
│   ├── NoticeCardShimmer.jsx            # Skeleton loading
│   └── NoticesListShimmer.jsx          # Lista de skeletons
└── styles/sections/Notices.scss         # Estilos
```

### **2. Flujo de Datos**
```
API Backend → noticesService → noticeTransformers → useNoticesState → Notices.jsx
```

---

## 🔌 **Endpoints y API**

### **Base URL**
```javascript
const BASE_URL = 'http://localhost:8000/api'
```

### **Endpoints Utilizados**

#### **1. Obtener Notices**
```javascript
GET /notices?pagination=6&page=1
```
- **Headers**: `Authorization: Bearer {token}`
- **Respuesta**: Lista paginada de notices
- **Estructura**:
```json
{
  "http_status": 200,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Notice Title",
        "notice_category_id": 9,
        "thumbnail": "image.webp",
        "file": "document.pdf",
        "link": "https://example.com",
        "status": 1,
        "description": "{\"descriptionHtml\":\"<p>Content</p>\",\"descriptionText\":\"Content\"}",
        "original_thumbnail": "http://localhost:8000/storage/notices/image.webp",
        "blurred_thumbnail": "http://localhost:8000/storage/notices/thumbnails/image.webp",
        "notice_category": {
          "id": 9,
          "title": "Finances",
          "status": 1
        }
      }
    ],
    "pagination": {...}
  }
}
```

#### **2. Crear Notice**
```javascript
POST /notices
```
- **Content-Type**: `multipart/form-data`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: FormData con archivos y datos
- **Campos**:
  - `name`: Título del notice
  - `notice_category_id`: ID de la categoría
  - `thumbnail`: Archivo de imagen (File object)
  - `file`: Archivo PDF generado (File object)
  - `link`: URL del enlace
  - `status`: Estado (1 = activo)
  - `description`: JSON con HTML y texto plano

#### **3. Actualizar Notice**
```javascript
PUT /notices/{id}
```
- **Content-Type**: `multipart/form-data`
- **Headers**: `Authorization: Bearer {token}`
- **Body**: FormData similar al create

#### **4. Eliminar Notice**
```javascript
DELETE /notices/{id}
```
- **Headers**: `Authorization: Bearer {token}`

---

## 🔐 **Manejo de Autenticación**

### **Token Management**
```javascript
// En noticesService.js
const getAuthHeaders = () => {
  const token = localStorage.getItem('bvi.auth.token')
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

// Para FormData (sin Content-Type)
const getAuthHeadersForFormData = () => {
  const token = localStorage.getItem('bvi.auth.token')
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}
```

### **Validación de Token**
```javascript
const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Token expirado - redirigir a login
      localStorage.removeItem('bvi.auth.token')
      window.location.href = '/login'
      return
    }
    throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
  }
  return response.json()
}
```

---

## 📊 **Gestión de Estado**

### **useNoticesState.js - Hook Principal**

#### **Estados Principales**
```javascript
const [notices, setNotices] = useState([])                    // Lista de notices
const [categories, setCategories] = useState([])             // Categorías disponibles
const [activeCategory, setActiveCategory] = useState(null)   // Categoría activa
const [noticesLoading, setNoticesLoading] = useState(false)  // Loading state
const [editingNotice, setEditingNotice] = useState(null)     // Notice en edición
```

#### **Funciones Principales**

**1. Cargar Notices desde API**
```javascript
const loadNoticesFromAPI = useCallback(async () => {
  setNoticesLoading(true)
  
  // Suprimir errores 404 temporalmente
  const originalConsoleError = console.error
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('404')) {
      return
    }
    originalConsoleError.apply(console, args)
  }
  
  try {
    const response = await noticesService.getNotices()
    
    if (response.http_status === 200 && response.data) {
      // Transformar datos de API a formato frontend
      const apiNotices = response.data.data.map(notice => transformFromBackend(notice))
      setNotices(apiNotices)
    }
  } catch (error) {
    // Solo logear errores no-404
    if (!error.message.includes('No notices found') && !error.message.includes('No data found')) {
      console.error('Error loading notices from API:', error)
    }
    setNotices([])
  } finally {
    setNoticesLoading(false)
    // Restaurar console.error original
    console.error = originalConsoleError
  }
}, [])
```

**2. Filtrar Notices por Categoría**
```javascript
const visibleItems = useMemo(() => {
  if (!notices || notices.length === 0) return []
  
  // Filtrar por categoría activa
  return notices.filter(notice => notice.noticeType === activeCategory)
}, [notices, activeCategory])
```

**3. Crear Notice**
```javascript
const createNotice = useCallback(async (noticeData) => {
  try {
    const backendData = transformToBackend(noticeData, false)
    const response = await noticesService.createNotice(backendData)
    
    if (response.http_status === 200) {
      // Mover imagen de tempId a ID real en localStorage
      if (noticeData.tempId) {
        const tempImage = getNoticeImageFromLocalStorage(noticeData.tempId)
        const tempBlurred = getNoticeBlurredImageFromLocalStorage(noticeData.tempId)
        
        if (tempImage) {
          saveNoticeImageToLocalStorage(response.data.id, tempImage)
          removeNoticeImageFromLocalStorage(noticeData.tempId)
        }
        if (tempBlurred) {
          saveNoticeBlurredImageToLocalStorage(response.data.id, tempBlurred)
          removeNoticeBlurredImageFromLocalStorage(noticeData.tempId)
        }
      }
      
      // Recargar lista después de crear
      setTimeout(() => {
        loadNoticesFromAPI()
      }, 100)
      
      return response.data
    }
  } catch (error) {
    console.error('Error creating notice:', error)
    throw error
  }
}, [loadNoticesFromAPI])
```

---

## 🔄 **Transformación de Datos**

### **noticeTransformers.js**

#### **Mapeo de Campos**
```javascript
const FIELD_MAPPINGS = {
  frontendToBackend: {
    id: 'id',
    fileName: 'name',                    // fileName → name
    noticeType: 'notice_category_id',   // noticeType → notice_category_id
    thumbnail: 'thumbnail',             // thumbnail → thumbnail (File object)
    linkUrl: 'link',                    // linkUrl → link
    file: 'file',                       // file → file (PDF File object)
    status: 'status'                    // status → status
  },
  backendToFrontend: {
    id: 'id',
    name: 'fileName',                   // name → fileName
    notice_category_id: 'noticeType',  // notice_category_id → noticeType
    thumbnail: 'thumbnail',             // thumbnail → thumbnail
    link: 'linkUrl',                    // link → linkUrl
    file: 'file',                       // file → file
    status: 'status'                   // status → status
  }
}
```

#### **Transformación Frontend → Backend**
```javascript
const transformToBackend = (frontendNotice, isEdit = false) => {
  const baseData = {}
  
  // Mapear campos básicos
  Object.entries(FIELD_MAPPINGS.frontendToBackend).forEach(([frontendKey, backendKey]) => {
    if (frontendNotice[frontendKey] !== undefined) {
      baseData[backendKey] = frontendNotice[frontendKey]
    }
  })
  
  // Manejar descripción
  if (frontendNotice.description) {
    baseData.description = JSON.stringify({
      descriptionHtml: frontendNotice.editorHtml || '',
      descriptionText: frontendNotice.description
    })
  }
  
  return baseData
}
```

#### **Transformación Backend → Frontend**
```javascript
const transformFromBackend = (backendNotice) => {
  const frontendNotice = {}
  
  // Mapear campos básicos
  Object.entries(FIELD_MAPPINGS.backendToFrontend).forEach(([backendKey, frontendKey]) => {
    if (backendNotice[backendKey] !== undefined) {
      frontendNotice[frontendKey] = backendNotice[backendKey]
    }
  })
  
  // Manejar descripción
  if (backendNotice.description) {
    try {
      const descriptionData = JSON.parse(backendNotice.description)
      frontendNotice.description = descriptionData.descriptionText || ''
      frontendNotice.editorHtml = descriptionData.descriptionHtml || ''
    } catch (error) {
      frontendNotice.description = backendNotice.description
      frontendNotice.editorHtml = ''
    }
  }
  
  // Manejar imágenes
  frontendNotice.original_thumbnail = backendNotice.original_thumbnail
  frontendNotice.blurred_thumbnail = backendNotice.blurred_thumbnail
  frontendNotice.imagePreviewUrl = backendNotice.original_thumbnail
  
  return frontendNotice
}
```

---

## 🖼️ **Manejo de Imágenes**

### **localStorage Strategy**

#### **Guardar Imagen**
```javascript
const saveNoticeImageToLocalStorage = async (noticeId, imageFile) => {
  // Verificar que es una imagen (no PDF)
  if (!imageFile.type.startsWith('image/')) {
    console.warn('⚠️ Not an image file, skipping localStorage save')
    return
  }
  
  try {
    const base64 = await fileToBase64(imageFile)
    const imageData = {
      id: noticeId,
      data: base64,
      timestamp: Date.now()
    }
    
    saveNoticesImagesToStorage(imageData)
  } catch (error) {
    console.error('❌ Error saving notice image to localStorage:', error)
  }
}
```

#### **Recuperar Imagen**
```javascript
const getNoticeImageFromLocalStorage = (noticeId) => {
  try {
    const imagesData = JSON.parse(localStorage.getItem('bvi.notices.images') || '{}')
    return imagesData[noticeId] || null
  } catch (error) {
    console.error('❌ Error getting notice image from localStorage:', error)
    return null
  }
}
```

#### **Manejo de Quota Exceeded**
```javascript
const saveNoticesImagesToStorage = (imageData) => {
  try {
    const imagesData = JSON.parse(localStorage.getItem('bvi.notices.images') || '{}')
    imagesData[imageData.id] = imageData.data
    localStorage.setItem('bvi.notices.images', JSON.stringify(imagesData))
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota exceeded, clearing old images')
      
      // Limpiar imágenes antiguas y reintentar
      try {
        localStorage.removeItem('bvi.notices.images')
        const newImagesData = { [imageData.id]: imageData.data }
        localStorage.setItem('bvi.notices.images', JSON.stringify(newImagesData))
      } catch (retryError) {
        console.error('❌ Failed to save even after clearing localStorage')
      }
    } else {
      console.error('❌ Error saving notices images to localStorage:', error)
    }
  }
}
```

---

## 📄 **Generación de PDF**

### **Proceso de Generación**
```javascript
// En Notices.jsx - handleSubmit
const generatePDF = async (noticeData) => {
  try {
    const pdfBlob = await pdf(<NoticePDFDocument notice={noticeData} />).toBlob()
    const pdfFile = new File([pdfBlob], `${noticeData.fileName}.pdf`, {
      type: 'application/pdf'
    })
    
    return pdfFile
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}
```

### **Estructura del PDF**
```javascript
// NoticePDFDocument.jsx
const NoticePDFDocument = ({ notice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{notice.fileName}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>{notice.description}</Text>
        
        {notice.linkUrl && (
          <Text style={styles.link}>
            Enlace: {notice.linkUrl}
          </Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Generado el {new Date().toLocaleDateString()}
        </Text>
      </View>
    </Page>
  </Document>
)
```

---

## 🎨 **Sistema de Categorías**

### **Filtrado por Categoría**
```javascript
// En Notices.jsx
const handleCategoryChange = (categoryId) => {
  setActiveCategory(categoryId)
}

// Renderizado condicional
{visibleItems.length > 0 ? (
  <div className="notices-grid">
    {visibleItems.map(notice => (
      <NoticeCard key={notice.id} notice={notice} />
    ))}
  </div>
) : (
  <EmptyPage 
    title="No hay notices en esta categoría"
    description="Intenta con otra categoría o crea un nuevo notice"
  />
)}
```

### **Categorías Disponibles**
```javascript
const NOTICE_CATEGORIES = [
  { id: 9, title: 'Finances', icon: '💰' },
  { id: 10, title: 'Legal', icon: '⚖️' },
  { id: 11, title: 'General', icon: '📢' }
]
```

---

## ⚡ **Sistema de Loading (Shimmer)**

### **Componente Shimmer**
```javascript
// NoticeCardShimmer.jsx
const NoticeCardShimmer = () => (
  <div className="notice-card-skeleton">
    {/* Header: Title + Description + 3 Buttons */}
    <div className="notice-card-skeleton__header">
      <div className="notice-card-skeleton__header-left">
        <div className="notice-card-skeleton__title-line notice-card-skeleton__title-line--long"></div>
        <div className="notice-card-skeleton__description-line notice-card-skeleton__description-line--short"></div>
      </div>
      <div className="notice-card-skeleton__header-right">
        <div className="notice-card-skeleton__button-small"></div>
        <div className="notice-card-skeleton__button-medium"></div>
        <div className="notice-card-skeleton__button-large"></div>
      </div>
    </div>
    
    {/* Image */}
    <div className="notice-card-skeleton__image">
      <div className="notice-card-skeleton__shimmer"></div>
    </div>
    
    {/* Publication Date */}
    <div className="notice-card-skeleton__date">
      <div className="notice-card-skeleton__date-line"></div>
    </div>
  </div>
)
```

### **Animación CSS**
```scss
@keyframes shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.notice-card-skeleton__shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite;
}
```

---

## 🔧 **Manejo de Errores**

### **Tipos de Errores**

#### **1. Errores de API**
```javascript
const handleResponse = async (response) => {
  if (!response.ok) {
    switch (response.status) {
      case 401:
        // Token expirado
        localStorage.removeItem('bvi.auth.token')
        window.location.href = '/login'
        break
      case 404:
        // No encontrado
        throw new Error('No notices found')
      case 500:
        // Error del servidor
        throw new Error('Error del servidor: 500 Internal Server Error')
      default:
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
    }
  }
  return response.json()
}
```

#### **2. Errores de localStorage**
```javascript
try {
  localStorage.setItem('bvi.notices.images', JSON.stringify(data))
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Limpiar y reintentar
    localStorage.removeItem('bvi.notices.images')
    localStorage.setItem('bvi.notices.images', JSON.stringify(newData))
  }
}
```

#### **3. Errores de PDF Generation**
```javascript
try {
  const pdfBlob = await pdf(<NoticePDFDocument notice={noticeData} />).toBlob()
} catch (error) {
  console.error('Error generating PDF:', error)
  // Continuar sin PDF o mostrar error al usuario
}
```

---

## 📱 **Responsive Design**

### **Mobile Adaptations**
```scss
@media (max-width: 768px) {
  .notice-card-skeleton__header {
    padding: 12px;
    gap: 8px;
  }
  
  .notice-card-skeleton__button-small,
  .notice-card-skeleton__button-medium,
  .notice-card-skeleton__button-large {
    height: 24px;
    width: 24px;
  }
  
  .notice-card-skeleton__image {
    width: calc(100% - 24px);
    height: 120px;
  }
}
```

---

## 🚀 **Flujo Completo de Creación**

### **1. Usuario selecciona imagen**
```javascript
const handleImageChange = (file) => {
  setImageFile(file)
  setImagePreviewUrl(URL.createObjectURL(file))
  
  // Guardar en localStorage con tempId
  const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  saveNoticeImageToLocalStorage(tempId, file)
  setTempId(tempId)
}
```

### **2. Usuario completa formulario**
```javascript
const handleSubmit = async (formData) => {
  // Preservar imagen original antes de generar PDF
  const originalImageFile = payload.file
  
  // Generar PDF
  const pdfFile = await generatePDF(noticeData)
  
  // Preparar payload
  const payload = {
    ...formData,
    file: pdfFile,           // PDF para descarga
    thumbnail: originalImageFile,  // Imagen para thumbnail
    tempId: tempId          // ID temporal para mover imagen
  }
  
  // Enviar a backend
  await createNotice(payload)
}
```

### **3. Backend procesa y responde**
```javascript
// Backend guarda archivos y devuelve IDs
const response = {
  data: {
    id: 8,
    thumbnail: "2462428f-0376-48ea-85f7-1509cebc5cde.webp",
    file: "http://localhost:8000/storage/notices/document.pdf"
  }
}
```

### **4. Frontend mueve imagen de tempId a ID real**
```javascript
// En createNotice success
if (noticeData.tempId) {
  const tempImage = getNoticeImageFromLocalStorage(noticeData.tempId)
  if (tempImage) {
    saveNoticeImageToLocalStorage(response.data.id, tempImage)
    removeNoticeImageFromLocalStorage(noticeData.tempId)
  }
}
```

### **5. UI se actualiza automáticamente**
```javascript
// Recargar lista después de crear
setTimeout(() => {
  loadNoticesFromAPI()
}, 100)
```

---

## 🔍 **Debugging y Logs**

### **Logs Importantes**
```javascript
// En noticesService.js
console.log('=== CREATE NOTICE DEBUG ===')
console.log('Raw noticeData received:', noticeData)
console.log('FormData contents:')

// En noticeTransformers.js
console.log('=== TRANSFORM TO BACKEND DEBUG ===')
console.log('Frontend notice:', frontendNotice)
console.log('Final backend data:', backendData)

// En useNoticesState.js
console.log('=== CREATE NOTICE DEBUG ===')
console.log('Original payload:', payload)
console.log('Transformed backend data:', backendData)
```

### **Herramientas de Debug**
```javascript
// Limpiar localStorage
localStorage.clear()

// Ver contenido de localStorage
console.log('Images in localStorage:', JSON.parse(localStorage.getItem('bvi.notices.images') || '{}'))

// Ver notices en estado
console.log('Current notices:', notices)
console.log('Visible items:', visibleItems)
```

---

## 📋 **Checklist de Implementación**

### **✅ Funcionalidades Implementadas**
- [x] CRUD completo de notices
- [x] Sistema de categorías con filtrado
- [x] Generación automática de PDF
- [x] Manejo de imágenes con localStorage
- [x] Sistema de loading con shimmer
- [x] Responsive design para mobile
- [x] Manejo de errores robusto
- [x] Autenticación con tokens JWT
- [x] Transformación de datos frontend/backend
- [x] Quota management para localStorage

### **🔧 Configuraciones Requeridas**
- [x] Backend Laravel con endpoints configurados
- [x] CORS habilitado para desarrollo
- [x] Storage configurado para archivos
- [x] Base de datos con tablas notices y notice_categories
- [x] Autenticación JWT configurada

---

## 🎯 **Conclusión**

El sistema de Notices está completamente integrado con:
- **API REST** para operaciones CRUD
- **Autenticación JWT** para seguridad
- **localStorage** para cache de imágenes
- **PDF generation** automática
- **Sistema de categorías** con filtrado
- **Loading states** con shimmer
- **Responsive design** para todos los dispositivos

**¡Sistema robusto y listo para producción! 🚀✨**
