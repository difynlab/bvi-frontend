# Documentación de Botones de Descarga - Proyecto BVI Frontend

## Resumen General

Este documento proporciona un análisis completo de todos los botones de descarga implementados en el proyecto BVI Frontend, incluyendo su ubicación, funcionalidad actual y estado de implementación.

## Botones de Descarga Identificados

### 1. **Reports (Reportes)** - ✅ **IMPLEMENTADO**

**Ubicación:** `src/sections/reports/Reports.jsx`

**Funcionalidad:**
- **Desktop:** Botón con texto "Download PDF" (línea 386-388)
- **Mobile:** Botón con ícono de descarga o texto según tamaño de pantalla (línea 402-408)
- **Implementación:** Completamente funcional usando `downloadReport()` del hook `useReportsState`

**Código de implementación:**
```javascript
const downloadReport = useCallback((report) => {
  if (report.fileUrl) {
    // Create temporary anchor for download
    const link = document.createElement('a');
    link.href = report.fileUrl;
    link.download = report.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    console.info('Download report', report.id);
  }
}, []);
```

**Estilos:** `src/styles/sections/Reports.scss`
- `.btn-download` (línea 371)
- `.btn-download-mobile` (línea 837)
- `.btn-download-mobile--user` (línea 851)

---

### 2. **Legislation (Legislación)** - ✅ **IMPLEMENTADO**

**Ubicación:** `src/sections/legislation/Legislation.jsx`

**Funcionalidad:**
- Botón "Download PDF" para adjuntos de legislación (línea 171-176)
- **Implementación:** Funcional usando `handleDownloadAttachment()`

**Código de implementación:**
```javascript
const handleDownloadAttachment = (attachment) => {
  const url = attachment.fileUrl || attachment.linkUrl;
  if (url) {
    window.open(url, '_blank');
  }
};
```

**Estilos:** `src/styles/sections/Legislation.scss`
- `.download-btn` (línea 232)

---

### 3. **Membership (Membresía)** - ✅ **IMPLEMENTADO**

**Ubicación:** `src/sections/membership/Membership.jsx`

**Funcionalidad:**
- **Payment History:** Enlaces de descarga para recibos de pago (línea 96-102)
- **Member Details:** Enlaces de descarga para recibos de miembros (línea 130-136)
- **Implementación:** Enlaces directos usando `href` con URLs de recibos

**Características:**
- Responsive: Muestra ícono en móvil, texto en desktop
- Enlaces directos a archivos de recibos
- Funcionalidad de "Unlimited downloads and exports" mencionada en beneficios (línea 191)

**Estilos:** `src/styles/sections/Membership.scss`
- `.download-link` (línea 204)

---

### 4. **Notices (Avisos)** - ⚠️ **NO IMPLEMENTADO**

**Ubicación:** `src/sections/notices/Notices.jsx`

**Funcionalidad:**
- Botón "Download Notice" (línea 515-520 y 553-558)
- **Estado:** Solo placeholder con comentario TODO
- **Implementación:** Pendiente

**Código actual:**
```javascript
onClick={() => {/* TODO: Implement download functionality */ }}
```

**Estilos:** `src/styles/sections/Notices.scss`
- `.download-btn` (línea 717)

---

### 5. **Newsletters (Boletines)** - ⚠️ **NO IMPLEMENTADO**

**Ubicación:** `src/sections/newsletters/Newsletters.jsx`

**Funcionalidad:**
- **Desktop:** Botón "Download PDF" (línea 278-284)
- **Mobile Admin:** Botón con ícono de descarga (línea 272-276)
- **Estado:** Solo placeholder con comentario TODO
- **Implementación:** Pendiente

**Código actual:**
```javascript
onClick={() => {/* TODO: Implement download functionality */ }}
```

**Estilos:** `src/styles/sections/Newsletters.scss`
- `.download-btn` (línea 456, 483)
- `.download-btn-mobileAdmin` (línea 456)

---

## Resumen de Estado de Implementación

| Sección | Estado | Funcionalidad | Archivo Principal |
|---------|--------|---------------|-------------------|
| **Reports** | ✅ Implementado | Descarga de PDFs de reportes | `Reports.jsx` |
| **Legislation** | ✅ Implementado | Descarga de adjuntos PDF | `Legislation.jsx` |
| **Membership** | ✅ Implementado | Descarga de recibos | `Membership.jsx` |
| **Notices** | ⚠️ Pendiente | Descarga de avisos | `Notices.jsx` |
| **Newsletters** | ⚠️ Pendiente | Descarga de boletines PDF | `Newsletters.jsx` |

## Patrones de Implementación Identificados

### 1. **Patrón de Descarga Directa (Reports)**
```javascript
// Crear elemento anchor temporal
const link = document.createElement('a');
link.href = fileUrl;
link.download = fileName;
link.target = '_blank';
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
```

### 2. **Patrón de Apertura en Nueva Ventana (Legislation)**
```javascript
// Abrir URL en nueva ventana
window.open(url, '_blank');
```

### 3. **Patrón de Enlace Directo (Membership)**
```html
<a href={receiptUrl} className="download-link">
  Download
</a>
```

## Consideraciones de Diseño

### Responsive Design
- Todos los botones tienen versiones móviles y desktop
- En móvil se usan íconos (`bi bi-download`)
- En desktop se muestra texto descriptivo

### Permisos de Usuario
- Los botones respetan los permisos de usuario definidos en `authHelpers.js`
- Algunos botones solo son visibles para administradores
- Usuarios regulares tienen acceso de "read/download only"

### Estilos Consistentes
- Todos usan clases CSS consistentes (`.download-btn`, `.btn-download`)
- Estilos hover implementados
- Colores y espaciado uniformes

## Recomendaciones para Implementación Pendiente

### Para Notices y Newsletters:

1. **Implementar función de descarga similar a Reports:**
```javascript
const downloadNotice = useCallback((notice) => {
  if (notice.fileUrl) {
    const link = document.createElement('a');
    link.href = notice.fileUrl;
    link.download = notice.fileName || notice.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}, []);
```

2. **Agregar al hook correspondiente:**
- `useNoticesState.js` para notices
- `useNewslettersState.js` para newsletters

3. **Mantener consistencia con patrones existentes**

## Archivos de Estilos Relacionados

- `src/styles/sections/Reports.scss`
- `src/styles/sections/Legislation.scss`
- `src/styles/sections/Membership.scss`
- `src/styles/sections/Notices.scss`
- `src/styles/sections/Newsletters.scss`

---

*Documento generado automáticamente - Última actualización: $(date)*
