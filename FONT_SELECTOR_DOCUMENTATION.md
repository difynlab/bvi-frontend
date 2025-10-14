# Selector de Fuentes del WYSIWYG - Documentación Técnica

## 🎯 **Resumen General**

El selector de fuentes en el WYSIWYG utiliza la extensión **TextStyle** de TipTap para aplicar diferentes familias de fuentes al texto seleccionado. Funciona mediante un elemento `<select>` que sincroniza su estado con los atributos del editor en tiempo real.

## 🏗️ **Arquitectura del Sistema**

### **Componentes Principales:**
1. **RichTextEditor.jsx** - Componente principal del editor
2. **TextStyle Extension** - Extensión de TipTap para estilos de texto
3. **Estado React** - Manejo del estado de la fuente actual
4. **Sincronización** - Sistema de eventos para mantener consistencia

## 🔧 **Implementación Técnica**

### **1. Configuración del Editor**

```javascript
// RichTextEditor.jsx - Configuración de extensiones
const editor = useEditor({
  extensions: [
    StarterKit,
    TextStyle,  // ← Extensión clave para fuentes
    Color,
    // ... otras extensiones
  ],
  // ... configuración
})
```

### **2. Estado del Selector**

```javascript
// Estado local para la fuente actual
const [currentFont, setCurrentFont] = useState('')

// Estado inicial vacío - se sincroniza con el editor
```

### **3. Elemento HTML del Selector**

```javascript
// RichTextEditor.jsx - Selector de fuentes
<div className="rte__group">
  <select
    className="rte__select rte__select--font"
    value={currentFont}
    onChange={(e) => {
      const val = e.target.value
      const chain = editor.chain().focus()
      
      if (!val) {
        // Si no hay valor, remover el estilo de fuente
        chain.unsetMark('textStyle').run()
      } else {
        // Aplicar la nueva fuente usando TextStyle
        chain.setMark('textStyle', { fontFamily: val }).run()
      }
    }}
    aria-label="Font family"
  >
    <option value="Arial">Arial</option>
    <option value="'Public Sans'">Public Sans</option>
    <option value="'Times New Roman'">Times New Roman</option>
  </select>
</div>
```

## 🔄 **Sistema de Sincronización**

### **Función de Sincronización**

```javascript
// useEffect para sincronizar atributos del editor
useEffect(() => {
  if (!editor) return

  const syncAttrs = () => {
    // Obtener la fuente actual del texto seleccionado
    setCurrentFont(editor.getAttributes('textStyle')?.fontFamily || '')
    
    // También sincroniza el color (funcionalidad adicional)
    const textColor = editor.getAttributes('textStyle')?.color
    const finalColor = textColor || '#000000'
    setCurrentTextColor(finalColor)
  }

  // Eventos que triggean la sincronización
  editor.on('update', syncAttrs)           // Cuando se actualiza el contenido
  editor.on('selectionUpdate', syncAttrs) // Cuando cambia la selección
  editor.on('transaction', syncAttrs)     // Cuando hay transacciones del editor
  editor.on('focus', syncAttrs)           // Cuando el editor recibe foco
  editor.on('blur', syncAttrs)           // Cuando el editor pierde foco
  
  // Sincronización inicial
  syncAttrs()

  // Cleanup de event listeners
  return () => {
    editor.off('update', syncAttrs)
    editor.off('selectionUpdate', syncAttrs)
    editor.off('transaction', syncAttrs)
    editor.off('focus', syncAttrs)
    editor.off('blur', syncAttrs)
  }
}, [editor])
```

## 📝 **Fuentes Disponibles**

### **Lista de Fuentes Configuradas:**

| Valor | Nombre Mostrado | Descripción |
|-------|----------------|-------------|
| `"Arial"` | Arial | Fuente sans-serif estándar |
| `"'Public Sans'"` | Public Sans | Fuente principal del sistema |
| `"'Times New Roman'"` | Times New Roman | Fuente serif clásica |

### **Notas Importantes:**
- **Public Sans** es la fuente por defecto del sistema (definida en `styles.scss`)
- Las fuentes con espacios requieren comillas simples en el valor
- El valor vacío (`""`) remueve cualquier estilo de fuente aplicado

## 🎨 **Estilos CSS**

### **Estilos del Selector:**

```scss
// RichTextEditor.scss - Estilos del selector
.rte__select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  min-width: 120px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $vivid_blue;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  // Estilo específico para el selector de fuentes
  &.rte__select--font {
    min-width: 140px;  // Más ancho para mostrar nombres de fuentes
  }
}
```

### **Responsive Design:**

```scss
// Estilos móviles
@media (max-width: 768px) {
  .rte__toolbar {
    .rte__group {
      .rte__select {
        min-width: 100% !important;
        font-size: 12px;
        line-height: 16px;
        padding: 4px 6px;
      }
    }
  }
}
```

## ⚙️ **Funcionamiento Interno**

### **1. Aplicación de Fuente:**

```javascript
// Cuando el usuario selecciona una fuente
onChange={(e) => {
  const val = e.target.value
  const chain = editor.chain().focus()
  
  if (!val) {
    // Remover estilo de fuente
    chain.unsetMark('textStyle').run()
  } else {
    // Aplicar nueva fuente
    chain.setMark('textStyle', { fontFamily: val }).run()
  }
}}
```

### **2. Lectura de Atributos:**

```javascript
// Obtener la fuente actual del texto seleccionado
const fontFamily = editor.getAttributes('textStyle')?.fontFamily || ''
setCurrentFont(fontFamily)
```

### **3. Generación de HTML:**

```html
<!-- El HTML generado incluye el estilo inline -->
<span style="font-family: 'Public Sans'">Texto con fuente aplicada</span>
```

## 🔍 **Flujo de Datos Completo**

### **1. Inicialización:**
```
Editor se monta → syncAttrs() → currentFont = ''
```

### **2. Selección de Texto:**
```
Usuario selecciona texto → selectionUpdate → syncAttrs() → 
currentFont = editor.getAttributes('textStyle')?.fontFamily
```

### **3. Cambio de Fuente:**
```
Usuario cambia selector → onChange → editor.chain().setMark() → 
update → syncAttrs() → currentFont actualizado
```

### **4. Guardado:**
```
onUpdate → onChange callback → HTML con estilos inline → 
Almacenamiento en editorHtml
```

## 🛠️ **API de TipTap Utilizada**

### **Métodos Principales:**

```javascript
// Obtener atributos del texto seleccionado
editor.getAttributes('textStyle')

// Aplicar marca de estilo
editor.chain().focus().setMark('textStyle', { fontFamily: 'Arial' }).run()

// Remover marca de estilo
editor.chain().focus().unsetMark('textStyle').run()

// Verificar si un estilo está activo
editor.isActive('textStyle', { fontFamily: 'Arial' })
```

### **Eventos del Editor:**

```javascript
// Eventos que triggean sincronización
'update'           // Contenido modificado
'selectionUpdate'  // Selección de texto cambiada
'transaction'      // Transacción del editor
'focus'           // Editor recibe foco
'blur'            // Editor pierde foco
```

## 🎯 **Características Especiales**

### **1. Sincronización Bidireccional:**
- El selector refleja la fuente del texto seleccionado
- Los cambios en el selector se aplican inmediatamente al texto

### **2. Persistencia de Estado:**
- La fuente se mantiene al navegar por el texto
- Se preserva en el HTML generado

### **3. Accesibilidad:**
- `aria-label="Font family"` para lectores de pantalla
- Navegación por teclado funcional

### **4. Responsive:**
- Adaptación automática en dispositivos móviles
- Tamaños de fuente ajustados para pantallas pequeñas

## 🐛 **Consideraciones Técnicas**

### **1. Fuentes con Espacios:**
```javascript
// Correcto - con comillas simples
<option value="'Public Sans'">Public Sans</option>

// Incorrecto - sin comillas
<option value="Public Sans">Public Sans</option>
```

### **2. Estado Vacío:**
```javascript
// Manejo del estado vacío
if (!val) {
  chain.unsetMark('textStyle').run()  // Remover estilo
} else {
  chain.setMark('textStyle', { fontFamily: val }).run()  // Aplicar estilo
}
```

### **3. Sincronización de Eventos:**
```javascript
// Importante: limpiar event listeners
return () => {
  editor.off('update', syncAttrs)
  editor.off('selectionUpdate', syncAttrs)
  // ... otros eventos
}
```

## 🚀 **Posibles Mejoras**

### **1. Más Fuentes:**
```javascript
// Agregar más opciones
<option value="'Helvetica'">Helvetica</option>
<option value="'Georgia'">Georgia</option>
<option value="'Courier New'">Courier New</option>
```

### **2. Vista Previa:**
```javascript
// Mostrar vista previa de la fuente en el selector
<option value="Arial" style="font-family: Arial">Arial</option>
```

### **3. Fuentes Personalizadas:**
```javascript
// Cargar fuentes dinámicamente
const customFonts = ['Custom Font 1', 'Custom Font 2']
```

### **4. Persistencia de Preferencias:**
```javascript
// Guardar preferencia de fuente del usuario
localStorage.setItem('preferredFont', selectedFont)
```

---

## 📊 **Resumen Técnico**

| Aspecto | Implementación |
|---------|----------------|
| **Base Tecnológica** | TipTap + TextStyle Extension |
| **Estado** | React useState + Sincronización |
| **Fuentes** | 3 opciones predefinidas |
| **Sincronización** | 5 eventos del editor |
| **HTML Output** | Estilos inline con font-family |
| **Responsive** | ✅ Adaptado para móviles |
| **Accesibilidad** | ✅ aria-label incluido |

El selector de fuentes es un componente robusto que proporciona una experiencia de usuario fluida para la aplicación de diferentes familias de fuentes en el contenido del editor WYSIWYG.
