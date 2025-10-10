# Estructura de Modals de Events - Documentación Técnica

## 📋 Información General

Los modals de Events se utilizan para **crear** y **editar** eventos en la aplicación. Ambos modals comparten la misma estructura y campos, diferenciándose solo en el modo de operación.

## 🏗️ Estructura del Modal

### Contenedor Principal
```jsx
<div className="events-modal-overlay">
  <div className="events-modal">
    {/* Contenido del modal */}
  </div>
</div>
```

### Propiedades CSS del Contenedor

#### `.events-modal-overlay`
- **Position**: `fixed`
- **Z-index**: Alto (por encima de otros elementos)
- **Background**: Overlay semi-transparente
- **Cubre**: Toda la pantalla (`width: 100vw`, `height: 100vh`)
- **Centrado**: Flexbox para centrar el modal

#### `.events-modal`
- **Position**: `relative`
- **Background**: `white`
- **Border-radius**: `8px` o `12px`
- **Max-width**: `600px` aproximadamente
- **Max-height**: `90vh` (responsive)
- **Overflow**: `auto` para scroll interno
- **Box-shadow**: Sombra para efecto de elevación

## 📝 Campos del Formulario

### 1. **Título del Evento**
```jsx
<div className="form-group">
  <label htmlFor="title">Event Title<span className="req-star">*</span></label>
  <input
    type="text"
    id="title"
    name="title"
    value={eventForm.form.title}
    onChange={handleInputChange}
    required
  />
</div>
```

**Propiedades:**
- **Tipo**: `text`
- **Requerido**: ✅ Sí
- **Validación**: Campo obligatorio
- **Placeholder**: No tiene
- **Max-length**: Sin límite específico

### 2. **Fecha y Hora**
```jsx
<div className="form-row">
  <div className="form-group">
    <label htmlFor="date">Date/Time<span className="req-star">*</span></label>
    <input
      type="date"
      id="date"
      name="date"
      value={eventForm.form.date}
      onChange={handleInputChange}
      min={getTodayDate()}
      required
    />
  </div>
  <div className="form-time">
    <div className="form-group">
      <input
        type="time"
        id="startTime"
        name="startTime"
        value={eventForm.form.startTime}
        onChange={handleInputChange}
      />
    </div>
    <i className="bi bi-dash"></i>
    <div className="form-group">
      <input
        type="time"
        id="endTime"
        name="endTime"
        min={eventForm.form.startTime || '00:00'}
        onChange={handleInputChange}
      />
    </div>
  </div>
</div>
```

**Propiedades:**
- **Fecha**: `type="date"`, requerida, mínimo = hoy
- **Hora inicio**: `type="time"`, no requerida
- **Hora fin**: `type="time"`, no requerida, mínimo = hora inicio
- **Layout**: `.form-row` con flexbox horizontal

### 3. **Zona Horaria**
```jsx
<div className="form-group">
  <label htmlFor="timeZone">Time Zone</label>
  <select
    id="timeZone"
    name="timeZone"
    value={eventForm.form.timeZone}
    onChange={handleInputChange}
  >
    {eventForm.TIME_ZONES.map(tz => (
      <option key={tz} value={tz}>{tz}</option>
    ))}
  </select>
</div>
```

**Propiedades:**
- **Tipo**: `select` dropdown
- **Requerido**: ❌ No
- **Opciones**: Array de zonas horarias predefinidas
- **Default**: Probablemente UTC o zona local

### 4. **Repetición (Repeat)**
```jsx
<div className="form-group repeat-field">
  <label htmlFor="repeat">Repeat</label>
  <select
    id="repeat"
    name="repeat"
    value={eventForm.form.repeat}
    onChange={handleInputChange}
    onClick={handleRepeatSelectClick}
  >
    {eventForm.REPEAT_OPTIONS.map(option => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
  <CustomRecurrencePopover
    isOpen={isCustomRecurrenceOpen}
    onClose={() => setIsCustomRecurrenceOpen(false)}
    onUpdate={handleCustomRecurrenceUpdate}
    initialRecurrence={eventForm.form.recurrence}
  />
</div>
```

**Propiedades:**
- **Tipo**: `select` con popover personalizado
- **Requerido**: ❌ No
- **Opciones**: Array de opciones de repetición
- **Especial**: Incluye `CustomRecurrencePopover` para opciones avanzadas
- **Position**: `relative` para el popover

### 5. **Tipo de Evento**
```jsx
<div className="form-group">
  <label htmlFor="eventType">Event Type</label>
  <select
    id="eventType"
    name="eventType"
    value={eventForm.form.eventType}
    onChange={handleInputChange}
  >
    {eventForm.EVENT_TYPES.map(type => (
      <option key={type} value={type}>{type}</option>
    ))}
  </select>
</div>
```

**Propiedades:**
- **Tipo**: `select` dropdown
- **Requerido**: ❌ No
- **Opciones**: Array de tipos de evento predefinidos

### 6. **Descripción**
```jsx
<div className="form-group">
  <label htmlFor="description">Description<span className="req-star">*</span></label>
  <RichTextEditor
    docId={modalMode === 'edit' ? editingEventId : 'new'}
    initialHTML={eventForm.editorHtml}
    onChange={handleEditorChange}
    placeholder="Write a description..."
  />
</div>
```

**Propiedades:**
- **Tipo**: `RichTextEditor` (componente personalizado)
- **Requerido**: ✅ Sí
- **Funcionalidad**: Editor de texto enriquecido
- **Placeholder**: "Write a description..."
- **Position**: `relative`

### 7. **Ubicación**
```jsx
<div className="form-group">
  <label htmlFor="location">Location</label>
  <input
    type="text"
    id="location"
    name="location"
    value={eventForm.form.location}
    onChange={handleInputChange}
  />
</div>
```

**Propiedades:**
- **Tipo**: `text`
- **Requerido**: ❌ No
- **Placeholder**: No tiene

### 8. **Subida de Archivo**
```jsx
<div className="form-group">
  <label>File Upload<span className="req-star">*</span></label>
  <div
    className={`dropzone dropzone-surface ${isDragOver ? 'drag-over' : ''}`}
    data-has-file={Boolean(eventForm.form.imagePreviewUrl)}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
  >
    <input
      type="file"
      id="file"
      accept="image/*"
      onChange={handleFileInputChange}
      className="hidden-file-input"
    />
    <label htmlFor="file" className="file-input-label">
      Choose file
    </label>
    <p className="file-status">
      {eventForm.form.imageFileName || 'No file chosen'}
    </p>
    {eventForm.form.imagePreviewUrl && (
      <div className="image-preview">
        <img src={eventForm.form.imagePreviewUrl} alt="Preview" />
      </div>
    )}
  </div>
</div>
```

**Propiedades:**
- **Tipo**: `file` input con drag & drop
- **Requerido**: ✅ Sí
- **Accept**: Solo imágenes (`image/*`)
- **Funcionalidad**: Drag & drop, preview de imagen
- **Position**: `relative`
- **Estados**: `drag-over`, `data-has-file`

## 🎨 Estilos CSS Principales

### `.form-group`
- **Display**: `flex`
- **Flex-direction**: `column`
- **Gap**: `8px`
- **Margin-bottom**: `20px`
- **Width**: `100%`

### `.form-row`
- **Display**: `flex`
- **Flex-direction**: `row`
- **Align-items**: `end`
- **Height**: `70px`
- **Gap**: `16px`

### `.form-time`
- **Display**: `flex`
- **Align-items**: `center`
- **Gap**: `8px`

### `.dropzone`
- **Border**: `2px dashed #d1d5db`
- **Border-radius**: `8px`
- **Padding**: `20px`
- **Text-align**: `center`
- **Transition**: `border-color 0.2s`
- **Width**: `100%`

### `.dropzone.drag-over`
- **Border-color**: `$vivid_blue`
- **Background-color**: `#eff6ff`

## 📱 Responsive Design

### Mobile (`@media (max-width: 768px)`)
```scss
.events-modal {
  margin: 10px;
  max-height: calc(100vh - 20px);
  min-width: 95%;
  
  .form-row {
    flex-wrap: wrap;
  }
}
```

**Cambios en móvil:**
- **Margin**: `10px` (más pequeño)
- **Max-height**: `calc(100vh - 20px)`
- **Min-width**: `95%`
- **Form-row**: `flex-wrap: wrap`

## 🔧 Estados del Modal

### Modo Crear
- **Modal mode**: `'create'`
- **Editing ID**: `null`
- **Título**: "Event details"
- **Botón**: "Upload Now"

### Modo Editar
- **Modal mode**: `'edit'`
- **Editing ID**: ID del evento
- **Título**: "Event details"
- **Botón**: "Upload Now"
- **Datos**: Pre-cargados del evento

## 🎯 Validación y Errores

### Campos Requeridos
- ✅ **Title** (Título)
- ✅ **Date** (Fecha)
- ✅ **Description** (Descripción)
- ✅ **File Upload** (Archivo)

### Mensaje de Error
```jsx
{eventForm.errorMessage && (
  <div className="error-message">
    {eventForm.errorMessage}
  </div>
)}
```

**Propiedades del error:**
- **Position**: `relative`
- **Color**: Rojo (`#dc2626`)
- **Font-size**: `14px`
- **Line-height**: `1.3`

## 🎮 Interacciones

### Botones de Acción
```jsx
<div className="form-actions">
  <button type="submit" className="upload-now-btn">
    Upload Now
  </button>
</div>
```

### Botón de Cerrar
```jsx
<button
  className="close-btn"
  onClick={handleCancel}
>
  <i className="bi bi-x"></i>
</button>
```

**Position**: `absolute`, esquina superior derecha

## 🔄 Flujo de Datos

1. **Inicialización**: `eventForm.initializeCreate()` o `eventForm.beginEdit(event)`
2. **Cambios**: `handleInputChange()` → `eventForm.onChange()`
3. **Validación**: `validateForm()` → `eventForm.validate()`
4. **Envío**: `handleSubmit()` → `addEvent()` o `updateEvent()`
5. **Cierre**: `closeModal()` → `eventForm.resetForm()`

## 📊 Estructura de Datos

```javascript
eventForm.form = {
  title: string,
  date: string (YYYY-MM-DD),
  startTime: string (HH:MM),
  endTime: string (HH:MM),
  timeZone: string,
  repeat: string,
  eventType: string,
  description: string,
  location: string,
  imagePreviewUrl: string,
  imageFileName: string,
  recurrence: object
}
```

## 🎨 Componentes Adicionales

### RichTextEditor
- **Componente**: Editor de texto enriquecido personalizado
- **Funcionalidades**: Formato de texto, negrita, cursiva, etc.
- **Position**: `relative`
- **Height**: Variable según contenido

### CustomRecurrencePopover
- **Componente**: Popover para opciones de repetición personalizadas
- **Position**: `absolute` relativo al campo repeat
- **Z-index**: Alto para aparecer sobre otros elementos
- **Estados**: `isOpen` controla visibilidad

### ImagePreview
- **Componente**: Preview de imagen subida
- **Position**: `relative` dentro del dropzone
- **Max-width**: `100%` del contenedor
- **Aspect-ratio**: Mantiene proporciones originales

## 🔍 Validaciones Específicas

### Validación de Fecha
- **Mínimo**: Fecha actual o posterior
- **Formato**: YYYY-MM-DD
- **Timezone**: Considera zona horaria seleccionada

### Validación de Hora
- **Hora fin**: Debe ser posterior a hora inicio
- **Formato**: HH:MM (24 horas)
- **Rango**: 00:00 - 23:59

### Validación de Archivo
- **Tipo**: Solo imágenes (image/*)
- **Tamaño**: Límite máximo definido
- **Formatos**: JPG, PNG, GIF, WebP

## 🎯 Estados Visuales

### Estados del Dropzone
- **Normal**: Borde punteado gris
- **Drag Over**: Borde azul, fondo azul claro
- **Has File**: Muestra preview de imagen
- **Error**: Borde rojo, mensaje de error

### Estados de Campos
- **Normal**: Borde gris
- **Focus**: Borde azul
- **Error**: Borde rojo
- **Disabled**: Fondo gris, cursor not-allowed

## 📱 Comportamiento Mobile

### Modal en Mobile
- **Width**: 95% del viewport
- **Height**: Máximo 90vh
- **Scroll**: Interno si contenido excede altura
- **Padding**: Reducido para aprovechar espacio

### Formulario en Mobile
- **Campos**: Stack vertical
- **Botones**: Ancho completo
- **Inputs**: Tamaño de touch optimizado
- **Labels**: Siempre visibles

Esta documentación proporciona una visión completa de la estructura, propiedades y comportamiento de los modals de Events para su implementación en otros sistemas.
