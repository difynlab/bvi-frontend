# Análisis Completo del WYSIWYG en tu Aplicación

## 🏗️ **Arquitectura General**

Tu aplicación utiliza **TipTap** como base para el editor WYSIWYG, que es una librería moderna y extensible construida sobre ProseMirror. El componente principal es `RichTextEditor.jsx` ubicado en `src/components/editor/`.

## 📦 **Tecnologías y Dependencias**

### Librerías Principales:
- **@tiptap/react** - Core de TipTap para React
- **@tiptap/starter-kit** - Conjunto básico de extensiones
- **@tiptap/extension-underline** - Subrayado
- **@tiptap/extension-link** - Enlaces
- **@tiptap/extension-image** - Imágenes
- **@tiptap/extension-task-list** - Listas de tareas
- **@tiptap/extension-task-item** - Elementos de lista de tareas
- **@tiptap/extension-text-style** - Estilos de texto
- **@tiptap/extension-color** - Colores
- **@tiptap/extension-text-align** - Alineación de texto

## 🎯 **Funcionalidades del Editor**

### **1. Formato de Texto**
```javascript
// Botones disponibles:
- Bold (Negrita)
- Italic (Cursiva) 
- Underline (Subrayado)
- Strikethrough (Tachado)
```

### **2. Tipografía**
```javascript
// Selector de fuentes:
- Arial
- Public Sans
- Times New Roman

// Tamaños de texto:
- Paragraph (Párrafo)
- Heading 1 (Título 1)
- Heading 2 (Título 2)
```

### **3. Colores**
```javascript
// Selector de color de texto:
- Color picker personalizado
- Botón para limpiar color (volver a negro)
- Sincronización visual con CSS custom properties
```

### **4. Listas**
```javascript
// Tipos de listas:
- Bullet List (Lista con viñetas)
- Ordered List (Lista numerada)
- Task List (Lista de tareas con checkboxes)
```

### **5. Enlaces e Imágenes**
```javascript
// Funcionalidades:
- Insertar enlaces con validación URL
- Insertar imágenes por URL
- Validación automática de URLs (https/http)
```

### **6. Alineación**
```javascript
// Opciones de alineación:
- Left (Izquierda)
- Center (Centro)
- Right (Derecha)
- Justify (Justificado) - implementado con CSS custom
```

### **7. Historial**
```javascript
// Control de cambios:
- Undo (Deshacer)
- Redo (Rehacer)
- Estados habilitados/deshabilitados dinámicamente
```

## 🔧 **Configuración del Editor**

### **Configuración Base:**
```javascript
const editor = useEditor({
  extensions: [
    StarterKit,           // Funcionalidades básicas
    Underline,            // Subrayado
    Link.configure({      // Enlaces con validación
      openOnClick: true,
      autolink: true,
      validate: href => /^https?:\/\//i.test(href)
    }),
    Image,                // Imágenes
    TaskList,             // Listas de tareas
    TaskItem.configure({  // Elementos de tareas
      nested: true,
    }),
    TextStyle,            // Estilos de texto
    Color,                // Colores
    TextAlign.configure({ // Alineación
      types: ['heading', 'paragraph', 'image'],
    }),
  ],
  content: initialHTML || '',
  autofocus: false,
  onUpdate: ({ editor }) => {
    onChange?.({ html: editor.getHTML() })
  }
})
```

## 📍 **Dónde se Utiliza**

### **1. Events (Eventos)**
- **Archivo:** `src/sections/events/Events.jsx`
- **Hook:** `useEventForm.js`
- **Campo:** `description`
- **Uso:** Descripción de eventos con formato completo

### **2. Notices (Avisos)**
- **Archivo:** `src/sections/notices/Notices.jsx`
- **Hook:** `useNoticeForm.js`
- **Campo:** `description`
- **Uso:** Descripción de avisos con formato completo

### **3. Newsletters (Boletines)**
- **Archivo:** `src/sections/newsletters/Newsletters.jsx`
- **Hook:** `useNewsletterForm.js`
- **Campo:** `description`
- **Uso:** Descripción de boletines con formato completo

### **4. Legislation (Legislación)**
- **Archivo:** `src/components/modals/LegislationEditModal.jsx`
- **Campo:** `description`
- **Uso:** Descripción de documentos legislativos

## 💾 **Cómo Guarda los Datos**

### **Estructura de Datos:**
```javascript
// Cada registro guarda DOS versiones:
{
  description: "Texto plano sin HTML",  // Para búsquedas y validaciones
  editorHtml: "<p>HTML formateado</p>" // Para visualización
}
```

### **Proceso de Guardado:**

#### **1. En Events:**
```javascript
// useEventForm.js - buildEventObject()
const buildEventObject = (existingId = null) => {
  return {
    id,
    title: form.title,
    description: editorText,    // Texto plano
    editorHtml: editorHtml,     // HTML formateado
    // ... otros campos
  }
}
```

#### **2. En Notices:**
```javascript
// useNoticeForm.js - toPayload()
const payload = {
  id,
  fileName: form.fileName,
  description: editorText,    // Texto plano
  editorHtml: editorHtml,     // HTML formateado
  // ... otros campos
}
```

#### **3. En Newsletters:**
```javascript
// useNewsletterForm.js - buildNewsletterObject()
return {
  id: existingId || `newsletter-${Date.now()}`,
  description: form.description.trim(),  // Texto plano
  editorHtml: editorHtml,                // HTML formateado
  // ... otros campos
}
```

## 🔄 **Flujo de Datos**

### **1. Carga de Datos:**
```javascript
// Prioridad de carga:
if (originalRef.current.editorHtml) {
  initialHtml = originalRef.current.editorHtml
  description = stripHtml(originalRef.current.editorHtml)
} else if (originalRef.current.description) {
  description = originalRef.current.description
  initialHtml = htmlFromPlain(originalRef.current.description)
}
```

### **2. Cambios en Tiempo Real:**
```javascript
// RichTextEditor.jsx - onUpdate
onUpdate: ({ editor }) => {
  onChange?.({ html: editor.getHTML() })
}

// En los componentes:
const handleEditorChange = (data) => {
  const html = typeof data === 'string' ? data : (data?.html || '');
  eventForm.setEditorHtml(html)
  const text = eventForm.stripHtml(html)
  eventForm.setEditorText(text)
  eventForm.onChange('description', text)
}
```

## 🎨 **Selector de Fuentes**

### **Implementación:**
```javascript
// RichTextEditor.jsx - Selector de fuentes
<select
  className="rte__select rte__select--font"
  value={currentFont}
  onChange={(e) => {
    const val = e.target.value
    const chain = editor.chain().focus()
    if (!val) {
      chain.unsetMark('textStyle').run()
    } else {
      chain.setMark('textStyle', { fontFamily: val }).run()
    }
  }}
>
  <option value="Arial">Arial</option>
  <option value="'Public Sans'">Public Sans</option>
  <option value="'Times New Roman'">Times New Roman</option>
</select>
```

### **Sincronización de Estado:**
```javascript
// useEffect para sincronizar atributos
const syncAttrs = () => {
  setCurrentFont(editor.getAttributes('textStyle')?.fontFamily || '')
  const textColor = editor.getAttributes('textStyle')?.color
  const finalColor = textColor || '#000000'
  setCurrentTextColor(finalColor)
}

// Eventos que triggean sincronización:
editor.on('update', syncAttrs)
editor.on('selectionUpdate', syncAttrs)
editor.on('transaction', syncAttrs)
editor.on('focus', syncAttrs)
editor.on('blur', syncAttrs)
```

## 🛠️ **Helpers y Utilidades**

### **1. Conversión de Texto:**
```javascript
// htmlFromPlain - Convierte texto plano a HTML
const htmlFromPlain = (txt = '') => {
  if (!txt || txt.trim() === '') return ''
  return '<p>' + escapeHtml(txt).replace(/\n/g, '<br/>') + '</p>'
}

// stripHtml - Extrae texto plano del HTML
const stripHtml = (html = '') => {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || ''
}

// escapeHtml - Escapa caracteres HTML
const escapeHtml = (text) => {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
```

### **2. Clonación Profunda:**
```javascript
// deepClone - Para rollback de cambios
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  // ... implementación completa
}
```

## 🎯 **Características Especiales**

### **1. Alineación Justificada:**
```javascript
// Implementación custom con CSS
const setTextAlign = useCallback((alignment) => {
  if (alignment === 'justify') {
    editor.commands.setTextAlign('left')
    const contentElement = editor.view.dom.querySelector('.rte__content')
    if (contentElement) {
      contentElement.classList.add('text-justify')
    }
  }
}, [editor])
```

### **2. Gestión de Estado:**
```javascript
// Estados locales del editor:
const [currentFont, setCurrentFont] = useState('')
const [currentTextColor, setCurrentTextColor] = useState('#000000')

// Estados en los hooks:
const [editorHtml, setEditorHtml] = useState('')
const [editorText, setEditorText] = useState('')
```

### **3. Validación de URLs:**
```javascript
// En el componente Link:
validate: href => /^https?:\/\//i.test(href)

// En los helpers:
import { isValidUrl } from '../helpers/urlValidation'
```

## 📱 **Responsive Design**

### **CSS Mobile:**
```scss
@media (max-width: 768px) {
  .rte__toolbar {
    padding: 8px;
    gap: 4px;
    justify-content: space-between;
    
    .rte__group {
      padding: 2px;
      gap: 2px;
      
      .rte__select {
        min-width: 100% !important;
      }
    }
  }
}
```

## 🔒 **Gestión de Memoria**

### **Cleanup de URLs:**
```javascript
// En useNewsletterForm.js
const clearFile = () => {
  if (form.imagePreviewUrl) {
    URL.revokeObjectURL(form.imagePreviewUrl)  // Libera memoria
  }
}
```

## 📊 **Resumen de Funcionalidades**

| Característica | Implementado | Ubicación |
|----------------|--------------|-----------|
| **Formato básico** | ✅ | RichTextEditor.jsx |
| **Fuentes** | ✅ | Selector + TextStyle |
| **Colores** | ✅ | Color extension |
| **Listas** | ✅ | StarterKit + TaskList |
| **Enlaces** | ✅ | Link extension |
| **Imágenes** | ✅ | Image extension |
| **Alineación** | ✅ | TextAlign + CSS custom |
| **Historial** | ✅ | StarterKit |
| **Responsive** | ✅ | SCSS media queries |
| **Validación** | ✅ | URL validation helpers |

## 🔍 **Archivos Clave**

### **Componentes:**
- `src/components/editor/RichTextEditor.jsx` - Componente principal del editor
- `src/styles/components/RichTextEditor.scss` - Estilos del editor

### **Hooks:**
- `src/hooks/useEventForm.js` - Manejo de formularios de eventos
- `src/hooks/useNoticeForm.js` - Manejo de formularios de avisos
- `src/hooks/useNewsletterForm.js` - Manejo de formularios de boletines

### **Secciones:**
- `src/sections/events/Events.jsx` - Implementación en eventos
- `src/sections/notices/Notices.jsx` - Implementación en avisos
- `src/sections/newsletters/Newsletters.jsx` - Implementación en boletines
- `src/components/modals/LegislationEditModal.jsx` - Implementación en legislación

### **Helpers:**
- `src/helpers/urlValidation.js` - Validación de URLs
- `src/helpers/newslettersValidation.js` - Validación de boletines

## 🚀 **Mejoras Futuras Sugeridas**

1. **Más fuentes:** Agregar más opciones de fuentes
2. **Tablas:** Implementar soporte para tablas
3. **Código:** Agregar soporte para bloques de código
4. **Emojis:** Integrar selector de emojis
5. **Plantillas:** Sistema de plantillas predefinidas
6. **Exportación:** Funciones para exportar a PDF/Word
7. **Colaboración:** Edición en tiempo real múltiple usuario

---

El WYSIWYG está muy bien implementado con una arquitectura sólida, separación de responsabilidades clara, y manejo robusto de datos tanto en formato HTML como texto plano para diferentes casos de uso.
